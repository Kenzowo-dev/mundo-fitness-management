import { randomUUID } from 'node:crypto';
import pino, { Logger } from 'pino';
import { config } from '../config/index.js';

/**
 * Determina si el entorno es desarrollo para habilitar logs verbosos y pretty-print.
 */
const isDevelopment = config.nodeEnv === 'development';

/**
 * Logger principal de la aplicación basado en Pino.
 * Configuración:
 * - Nivel: debug en desarrollo, info en producción
 * - Pretty printing en desarrollo para legibilidad humana
 * - Formato JSON estructurado en producción para agregación de logs
 * - Timestamps ISO 8601
 * - Campos base: service name y environment para filtrado en sistemas de observabilidad
 */
export const logger: Logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password', '*.password',
      'token', '*.token',
      'accessToken', '*.accessToken',
      'refreshToken', '*.refreshToken',
      'authorization', '*.authorization',
      'email', '*.email',
      'cookie', '*.cookie', 'req.headers.cookie', 'req.headers.authorization',
      'headers.cookie', 'headers.authorization',
      'secret', '*.secret', 'apiKey', '*.apiKey',
      'x-user-email', '*.x-user-email',
    ],
    censor: '[REDACTED]',
  },
  base: {
    service: process.env.SERVICE_NAME || 'unknown',
    environment: config.nodeEnv,
  },
});

/**
 * Crea un logger hijo con bindings (campos adicionales) predefinidos.
 * Útil para añadir contexto contextual como requestId, userId, operation, etc.
 * Los bindings se incluyen automáticamente en todas las entradas de log del child logger.
 *
 * @param bindings - Objeto con pares clave-valor para añadir a cada log
 * @returns Nuevo logger hijo con el contexto especificado
 *
 * Uso:
 * ```typescript
 * const requestLogger = createChildLogger({ requestId: 'abc-123', userId: 'user-456' });
 * requestLogger.info('Processing request'); // Incluye requestId y userId automáticamente
 * ```
 */
export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

interface HttpRequest {
  get(name: string): string | undefined;
  method: string;
  path: string;
  log?: Logger;
}

interface HttpResponse {
  setHeader(name: string, value: string): void;
  statusCode: number;
  once(event: 'finish', listener: () => void): this;
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export interface RequestWithLogger extends HttpRequest {
  requestId: string;
  log: Logger;
}

export function getRequestLogger(req: HttpRequest): Logger {
  return req.log ?? logger;
}

/** Assigns a safe correlation ID, returns it to the caller and logs request completion. */
export function requestLoggingMiddleware(serviceName: string) {
  return (req: HttpRequest, res: HttpResponse, next: () => void): void => {
    const suppliedId = req.get('x-request-id');
    const requestId = suppliedId && REQUEST_ID_PATTERN.test(suppliedId) ? suppliedId : randomUUID();
    const request = req as RequestWithLogger;
    const requestLogger = logger.child({ requestId, service: serviceName });
    const startedAt = process.hrtime.bigint();

    request.requestId = requestId;
    request.log = requestLogger;
    res.setHeader('x-request-id', requestId);

    res.once('finish', () => {
      requestLogger.info({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
      }, 'HTTP request completed');
    });

    next();
  };
}
