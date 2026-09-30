import { existsSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Busca el archivo .env más cercano al módulo actual.
 * Recorre los directorios padres hasta encontrar una configuración o llegar
 * a la raíz del sistema de archivos.
 *
 * @param startDir - Directorio inicial de la búsqueda
 * @returns Ruta absoluta del archivo .env o undefined si no existe
 */
function findEnvFile(startDir: string): string | undefined {
  let currentDir = startDir;

  while (true) {
    const candidates = process.env.ENV_FILE
      ? [path.resolve(process.env.ENV_FILE)]
      : [path.join(currentDir, '.env.local'), path.join(currentDir, '.env')];
    const candidate = candidates.find((file) => existsSync(file));
    if (candidate) return candidate;

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) return undefined;
    currentDir = parentDir;
  }
}

const envFile = findEnvFile(import.meta.dirname);
if (envFile) {
  dotenv.config({ path: envFile });
}

/**
 * Esquema de configuración tipado para toda la aplicación.
 * Centraliza todas las variables de entorno con tipos seguros.
 */
interface Config {
  nodeEnv: string;
  port: number;
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

/**
 * Obtiene variable de entorno requerida, lanza error si no existe.
 * Fuerza fail-fast al inicio si falta configuración crítica.
 *
 * @param key - Nombre de la variable de entorno
 * @returns Valor de la variable
 * @throws Error si la variable no está definida
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Configuración global de la aplicación.
 * Todas las variables se validan al importar este módulo (fail-fast).
 * Valores con defaults son opcionales; los required usan getRequiredEnv().
 */
export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  postgres: {
    host: getRequiredEnv('POSTGRES_HOST'),
    port: parseInt(getRequiredEnv('POSTGRES_PORT'), 10),
    database: getRequiredEnv('POSTGRES_DB'),
    user: getRequiredEnv('POSTGRES_USER'),
    password: getRequiredEnv('POSTGRES_PASSWORD'),
    ssl: process.env.POSTGRES_SSL === 'true',
    maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20', 10),
  },
  redis: {
    host: getRequiredEnv('REDIS_HOST'),
    port: parseInt(getRequiredEnv('REDIS_PORT'), 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: getRequiredEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
