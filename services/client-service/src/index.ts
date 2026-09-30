import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '@gym/shared/config/index.js';
import { logger } from '@gym/shared/logger/index.js';
import { requestLoggingMiddleware } from '@gym/shared/logger/index.js';
import { connectRedis, disconnectRedis, subscribe, CHANNELS, UserCreatedPayload } from '@gym/shared/messaging/index.js';
import { closePool } from '@gym/shared/database/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import clientRoutes from './routes/client.routes.js';

const app = express();
const SERVICE_NAME = 'client-service';

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
app.use(requestLoggingMiddleware(SERVICE_NAME));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Rate limiting global para prevenir abuso y DoS.
 * Configuración centralizada via shared config (windowMs, maxRequests).
 * Retorna 429 con headers estándar (Retry-After, X-RateLimit-*).
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
 * Health check endpoint para orchestration (K8s, Docker, load balancers).
 * Verifica conectividad a PostgreSQL con query simple.
 * Retorna 200 si healthy, 503 si DB no responde.
 */
app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'healthy', service: SERVICE_NAME, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unhealthy', service: SERVICE_NAME, timestamp: new Date().toISOString() });
  }
});

/**
 * Rutas de clientes bajo /api/clients:
 * GET /, GET /:id, POST /, PUT /:id, DELETE /:id
 * GET /:id/measurements, POST /:id/measurements
 * GET /:id/goals, POST /:id/goals
 * GET /:id/documents, POST /:id/documents
 */
app.use('/api/clients', clientRoutes);

/**
 * Middlewares de error al final (orden importa):
 * 1. notFoundHandler - 404 para rutas no registradas
 * 2. errorHandler - manejo centralizado de errores (AppError, ZodError, etc.)
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Importación tardía de query para evitar dependencias circulares
 * durante la inicialización de módulos compartidos.
 */
import { query } from '@gym/shared/database/index.js';

/**
 * Inicia el servidor HTTP y conexiones a dependencias.
 * Secuencia: Redis -> PostgreSQL -> HTTP server.
 * En fallo crítico, loggea error y termina proceso (exit 1).
 */
async function startServer(): Promise<void> {
  try {
    await connectRedis();
    logger.info('Redis connected');

    await query('SELECT 1');
    logger.info('Database connected');

    // Suscripción al evento USER_CREATED para sincronizar usuarios tipo socio con clientes
    await subscribe<UserCreatedPayload>(CHANNELS.USER_CREATED, async (payload) => {
      try {
        if (payload?.role === 'member') {
          const u = payload;
          const existing = await query('SELECT id FROM clients WHERE email = $1 OR user_id = $2', [u.email, u.userId]);
          if (existing.rows.length === 0) {
            await query(
              `INSERT INTO clients (user_id, dni, first_name, last_name, email, phone, birth_date, gender, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
               ON CONFLICT (dni) DO NOTHING`,
              [u.userId, `CLI-${u.userId}`, u.firstName || '', u.lastName || '', u.email, u.phone || null, u.birthDate || null, u.gender || null]
            );
            logger.info({ userId: u.userId }, 'Cliente creado automáticamente por evento USER_CREATED');
          } else {
            await query('UPDATE clients SET user_id = $1 WHERE email = $2', [u.userId, u.email]);
          }
        }
      } catch (err) {
        logger.error({ err }, 'Error procesando evento USER_CREATED en client-service');
      }
    });

    app.listen(config.port, () => {
      logger.info(`${SERVICE_NAME} running on port ${config.port}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

/**
 * Shutdown graceful para SIGTERM/SIGINT (Docker stop, K8s termination).
 * Cierra conexiones Redis y PostgreSQL antes de salir.
 * Timeout implícito: si tarda mucho, el orquestador hará SIGKILL.
 */
async function shutdown(): Promise<void> {
  logger.info('Shutting down...');
  await disconnectRedis();
  await closePool();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
