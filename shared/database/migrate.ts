import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, closePool } from './index.js';
import { logger } from '../logger/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de inicialización y migración de base de datos para Mundo Fitness.
 * Ejecuta el esquema DDL unificado y carga las semillas de datos maestros (seeds)
 * asegurando la creación correcta de tablas e índices en PostgreSQL.
 */
export async function runDatabaseInit(options: { seed?: boolean } = { seed: true }): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info('Iniciando proceso de migración de base de datos...');

    // 1. Leer y ejecutar el esquema DDL
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Archivo de esquema no encontrado en: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    logger.info('Ejecutando esquema DDL unificado (tablas, restricciones e índices)...');
    await client.query(schemaSql);
    logger.info('Esquema DDL aplicado exitosamente.');

    // 2. Si se solicitó cargar semillas, ejecutar seed.sql
    if (options.seed) {
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        logger.info('Cargando semillas de datos iniciales (roles, administrador, planes, etc.)...');
        const seedSql = fs.readFileSync(seedPath, 'utf-8');
        await client.query(seedSql);
        logger.info('Semillas cargadas exitosamente.');
      } else {
        logger.warn(`Archivo de semillas no encontrado en: ${seedPath}, omitiendo datos iniciales.`);
      }
    }

    logger.info('Base de datos inicializada y lista para producción.');
  } catch (error) {
    logger.error({ err: error }, 'Error crítico durante la inicialización de la base de datos');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

// Ejecución directa si se llama por CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const shouldSeed = !process.argv.includes('--no-seed');
  runDatabaseInit({ seed: shouldSeed })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
