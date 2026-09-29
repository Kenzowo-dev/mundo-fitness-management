import { Pool, PoolConfig, QueryResult, QueryResultRow, PoolClient } from 'pg';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';

/**
 * Configuración del pool de conexiones PostgreSQL.
 * Utiliza variables de entorno validadas a través del módulo de configuración compartido.
 * Incluye timeouts para evitar conexiones colgadas y SSL opcional.
 */
const poolConfig: PoolConfig = {
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.user,
  password: config.postgres.password,
  ssl: config.postgres.ssl ? { rejectUnauthorized: false } : false,
  max: config.postgres.maxConnections,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

/**
 * Pool principal de conexiones a PostgreSQL.
 * Se crea una única instancia compartida para toda la aplicación.
 * Maneja automáticamente la reconexión y el ciclo de vida de las conexiones.
 */
export const pool = new Pool(poolConfig);

/**
 * Manejo de errores inesperados en clientes inactivos del pool.
 * Si ocurre un error en una conexión ociosa, se registra y se termina el proceso
 * para forzar un reinicio limpio (útil en entornos orquestados como Kubernetes).
 */
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle client');
  process.exit(-1);
});

/**
 * Log de nuevas conexiones establecidas al pool.
 * Útil para monitorear la actividad de conexiones y detectar fugas.
 */
pool.on('connect', () => {
  logger.debug('New client connected to PostgreSQL');
});

/**
 * Ejecuta una consulta SQL parametrizada con logging de rendimiento.
 *
 * @param text - Consulta SQL con placeholders ($1, $2, ...)
 * @param params - Array de parámetros para la consulta preparada
 * @returns Resultado de la consulta con filas y metadatos
 *
 * Registra duración de la consulta y número de filas afectadas.
 * En caso de error, registra la consulta y el error antes de propagarlo.
 */
export type { PoolClient, QueryResult, QueryResultRow } from 'pg';

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug({ query: text, duration, rows: result.rowCount }, 'Executed query');
    return result;
  } catch (error) {
    logger.error({ err: error, query: text }, 'Query execution failed');
    throw error;
  }
}

/**
 * Obtiene un cliente dedicado del pool para transacciones o consultas múltiples.
 * Sobrescribe el método `query` para añadir logging automático.
 * Sobrescribe `release` para loguear la devolución del cliente al pool.
 *
 * @returns Cliente de PostgreSQL con logging integrado
 *
 * Importante: El caller DEBE llamar a `client.release()` cuando termine
 * para devolver la conexión al pool y evitar fugas.
 */
export async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  // Sobrescribe query para registrar automáticamente el rendimiento de cada consulta
  const loggedQuery = async (text: string, params?: unknown[]) => {
    const start = Date.now();
    try {
      const result = await originalQuery(text, params);
      const duration = Date.now() - start;
      logger.debug({ query: text, duration, rows: result.rowCount }, 'Executed query (client)');
      return result;
    } catch (error) {
      logger.error({ err: error, query: text }, 'Query execution failed (client)');
      throw error;
    }
  };

  // @ts-expect-error - se sobrescribe el método query para añadir registro de consultas
  client.query = loggedQuery;

  client.release = () => {
    logger.debug('Client released back to pool');
    return originalRelease();
  };

  return client;
}

/**
 * Ejecuta una callback dentro de una transacción ACID.
 * Maneja automáticamente BEGIN, COMMIT y ROLLBACK.
 * Si la callback lanza un error, hace rollback y propaga el error.
 * Siempre libera el cliente al pool en el bloque finally.
 *
 * @param callback - Función asíncrona que recibe el cliente y retorna el resultado
 * @returns Resultado de la callback
 *
 * Uso:
 * ```typescript
 * const result = await transaction(async (client) => {
 *   await client.query('INSERT INTO ...');
 *   await client.query('UPDATE ...');
 *   return { success: true };
 * });
 * ```
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Cierra el pool de conexiones de forma graceful.
 * Debe llamarse durante el shutdown de la aplicación para liberar recursos.
 */
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('PostgreSQL pool closed');
}