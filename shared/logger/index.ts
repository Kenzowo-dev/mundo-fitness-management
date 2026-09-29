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