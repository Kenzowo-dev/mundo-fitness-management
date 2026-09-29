import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, Options as ProxyOptions } from 'http-proxy-middleware';
import type * as http from 'node:http';
import type * as net from 'node:net';
import { config } from '@gym/shared/config/index.js';
import { logger } from '@gym/shared/logger/index.js';
import { connectRedis, disconnectRedis } from '@gym/shared/messaging/index.js';
import { extractTokenFromHeader, verifyAccessToken, TokenPayload } from '@gym/shared/utils/jwt.js';
import { AuthenticationError, isAppError } from '@gym/shared/errors/index.js';

const app = express();
const SERVICE_NAME = 'api-gateway';

/**
 * Extiende el tipo Request de Express para incluir el usuario autenticado.
 */
interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Establece SERVICE_NAME en process.env para que el logger compartido
 * incluya el nombre del servicio en todos los logs automáticamente.
 */
process.env.SERVICE_NAME = SERVICE_NAME;

/**
 * Middlewares globales de seguridad y parsing:
 * - helmet: headers de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.)
 * - cors: Cross-Origin Resource Sharing con config centralizada
 * - express.json/urlencoded: parsing de request body
 */
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Rate limiting global para prevenir abuso y DoS a nivel de gateway.
 * Protege todos los servicios downstream de tráfico excesivo.
 */
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

/**
 * Configuración de un servicio downstream para el proxy.
 * Incluye rutas públicas que no requieren autenticación (ej: login, register).
 */
interface ServiceConfig {
  name: string;
  url: string;
  paths: string[];
  publicPaths?: string[];
}

/**
 * Registro de todos los microservicios downstream.
 * Cada servicio define sus rutas base y endpoints públicos.
 * URLs configurables via environment variables para deployment flexible.
 */
const services: ServiceConfig[] = [
  {
    name: 'auth-service',
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    paths: ['/api/auth'],
    publicPaths: ['/register', '/login', '/refresh', '/forgot-password', '/reset-password'],
  },
  {
    name: 'client-service',
    url: process.env.CLIENT_SERVICE_URL || 'http://localhost:3002',
    paths: ['/api/clients'],
  },
  {
    name: 'membership-service',
    url: process.env.MEMBERSHIP_SERVICE_URL || 'http://localhost:3003',
    paths: ['/api/memberships'],
  },
  {
    name: 'payment-service',
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
    paths: ['/api/payments'],
  },
  {
    name: 'plan-service',
    url: process.env.PLAN_SERVICE_URL || 'http://localhost:3005',
    paths: ['/api/plans'],
  },
  {
    name: 'report-service',
    url: process.env.REPORT_SERVICE_URL || 'http://localhost:3006',
    paths: ['/api/reports'],
  },
];

/**
 * Verifica si una ruta es pública (no requiere autenticación).
 * Recorre la configuración de publicPaths de cada servicio.
 * Health checks siempre son públicos.
 *
 * @param path - Ruta de la request entrante (relativa al mount point)
 * @returns true si la ruta es pública, false si requiere auth
 */
function isPublicPath(path: string): boolean {
  for (const service of services) {
    if (service.publicPaths) {
      for (const publicPath of service.publicPaths) {
        if (path === publicPath || path.startsWith(publicPath + '/')) return true;
      }
    }
  }
  return path === '/health' || path.startsWith('/health/');
}

/**
 * Middleware de autenticación a nivel de gateway.
 * Valida JWT en todas las rutas no públicas antes de hacer proxy.
 * Inyecta payload del token en req.user para downstream services.
 *
 * Flujo:
 * 1. Si ruta pública -> next()
 * 2. Extraer Bearer token del header Authorization
 * 3. Verificar firma, expiración, issuer, audience
 * 4. Adjuntar payload a req.user
 * 5. Continuar al proxy
 */
function authenticateGateway(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (isPublicPath(req.path)) {
    return next();
  }

  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) {
    throw new AuthenticationError('Access token required', 'TOKEN_MISSING');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.debug({ err: error }, 'Token verification failed');
    throw new AuthenticationError('Invalid or expired token', 'TOKEN_INVALID');
  }
}

/**
 * Crea un proxy HTTP hacia un servicio downstream.
 * Configura:
 * - Reescritura de path para incluir el path base del servicio
 * - Inyección de headers de usuario (x-user-id, x-user-email, x-user-role, x-user-permissions)
 * - Logging de requests/responses
 * - Manejo de errores de conexión (502 Bad Gateway)
 *
 * @param service - Configuración del servicio destino
 * @returns Express RequestHandler que hace proxy al servicio
 */
function createProxy(service: ServiceConfig) {
  const basePath = service.paths[0];
  const proxyOptions: ProxyOptions<AuthenticatedRequest, Response> = {
    target: service.url,
    changeOrigin: true,
    proxyTimeout: 30000,
    timeout: 30000,
    selfHandleResponse: false,
    pathRewrite: (path: string) => {
      const rewritten = path.startsWith(basePath) ? path.slice(basePath.length) : path;
      return `${basePath}${rewritten}`;
    },
    on: {
      proxyReq: (proxyReq: http.ClientRequest, req: AuthenticatedRequest, _res: Response) => {
        if (req.user) {
          proxyReq.setHeader('x-user-id', req.user.sub);
          proxyReq.setHeader('x-user-email', req.user.email);
          proxyReq.setHeader('x-user-role', req.user.role);
          proxyReq.setHeader('x-user-permissions', JSON.stringify(req.user.permissions || []));
        }
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
        const rewrittenPath = req.path.startsWith(basePath) ? req.path.slice(basePath.length) : req.path;
        logger.debug({ service: service.name, path: req.path, method: req.method, rewrittenPath: `${basePath}${rewrittenPath}` }, 'Proxying request');
      },
      error: (err: Error, _req: http.IncomingMessage, res: Response | net.Socket) => {
        logger.error({ err, service: service.name }, 'Proxy error');
        const expressRes = res as Response;
        if (!expressRes.headersSent) {
          expressRes.status(502).json({
            error: {
              message: `Service ${service.name} unavailable`,
              code: 'SERVICE_UNAVAILABLE',
            },
          });
        }
      },
      proxyRes: (proxyRes: http.IncomingMessage, req: Request) => {
        logger.debug({ service: service.name, status: proxyRes.statusCode, path: req.path }, 'Proxy response received');
      },
    },
  };
  return createProxyMiddleware(proxyOptions) as express.RequestHandler;
}

/**
 * Registra rutas de proxy para cada servicio configurado.
 * Aplica autenticación y luego proxy en cadena.
 * Orden: authenticateGateway -> createProxy(service)
 */
for (const service of services) {
  for (const path of service.paths) {
    app.use(path, authenticateGateway, createProxy(service));
  }
}

/**
 * Health check agregado del gateway + todos los servicios downstream.
 * Hace fetch paralelo a /health de cada servicio con timeout 2s.
 * Retorna 200 si todos healthy, 503 si alguno falla (degraded).
 * Incluye status individual de cada servicio para debugging.
 */
app.get('/health', async (_req, res) => {
  const serviceHealth = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await fetch(`${service.url}/health`, { signal: AbortSignal.timeout(2000) });
        const data = await response.json() as { status: string };
        return { service: service.name, status: data.status, url: service.url };
      } catch {
        return { service: service.name, status: 'unhealthy', url: service.url };
      }
    })
  );

  const allHealthy = serviceHealth.every((s) => s.status === 'healthy');
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    services: serviceHealth,
  });
});

/**
 * Endpoint de discovery: lista todos los servicios registrados con sus rutas y URLs.
 * Útil para debugging y cliente API dinámico.
 */
app.get('/services', (_req, res) => {
  res.json({
    services: services.map((s) => ({
      name: s.name,
      paths: s.paths,
      url: s.url,
    })),
  });
});

/**
 * Catch-all para rutas no encontradas en el gateway.
 * Retorna 404 con formato de error estandarizado.
 */
app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
});

/**
 * Error handler global del gateway.
 * Captura errores no manejados (programming errors, proxy failures).
 * Loggea error completo y retorna statusCode apropiado para AppError.
 */
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Gateway error');
  
  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
  }
  
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
});

/**
 * Inicia el gateway HTTP y conexión a Redis (para rate limiting distribuido futuro).
 * No requiere PostgreSQL directo - solo Redis para messaging/rate-limit.
 */
async function startServer(): Promise<void> {
  try {
    await connectRedis();
    logger.info('Redis connected');

    app.listen(config.port, () => {
      logger.info(`${SERVICE_NAME} running on port ${config.port}`);
      logger.info('Configured services: ' + services.map((s) => `${s.name} -> ${s.url}`).join(', '));
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

/**
 * Shutdown graceful para SIGTERM/SIGINT.
 * Cierra conexión Redis antes de salir.
 */
async function shutdown(): Promise<void> {
  logger.info('Shutting down...');
  await disconnectRedis();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();