import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool, closePool } from "./index.js";
import { logger } from "../logger/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de inicializaciÃ³n y migraciÃ³n de base de datos para Mundo Fitness.
 * Ejecuta el esquema DDL unificado y carga las semillas de datos maestros (seeds)
 * asegurando la creaciÃ³n correcta de tablas e Ã­ndices en PostgreSQL.
 */

// Esta funciÃ³n registra los nombres de los archivos aplicados y ejecuta cada migraciÃ³n pendiente dentro de una transacciÃ³n.
async function applyPendingMigrations(
  client: import("pg").PoolClient,
): Promise<void> {
  const migrationsPath = [
    path.join(__dirname, "migrations"),
    path.join(__dirname, "migrations"),
  ].find((candidate) => fs.existsSync(candidate));

  if (!migrationsPath) {
    throw new Error("No se encontrÃ³ el directorio de migraciones");
  }

  if (!fs.existsSync(migrationsPath)) {
    logger.info("No existe carpeta de migraciones adicionales.");
    return;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = fs
    .readdirSync(migrationsPath)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    const existing = await client.query(
      "SELECT filename FROM schema_migrations WHERE filename = $1",
      [filename],
    );

    if (existing.rows.length > 0) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsPath, filename), "utf-8");

    await client.query("BEGIN");

    try {
      await client.query(sql);

      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [filename],
      );

      await client.query("COMMIT");

      logger.info({ filename }, "MigraciÃ³n aplicada correctamente");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

export async function runDatabaseInit(
  options: { seed?: boolean } = { seed: true },
): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info("Iniciando proceso de migraciÃ³n de base de datos...");

    // 1. Leer y ejecutar el esquema DDL
    const schemaPath = path.join(__dirname, "schema.sql");
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Archivo de esquema no encontrado en: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    logger.info(
      "Ejecutando esquema DDL unificado (tablas, restricciones e Ã­ndices)...",
    );
    await client.query(schemaSql);
    logger.info("Esquema DDL aplicado exitosamente.");
    await applyPendingMigrations(client);

    // 2. Si se solicitÃ³ cargar semillas, ejecutar seed.sql
    if (options.seed) {
      const seedPath = path.join(__dirname, "seed.sql");
      if (fs.existsSync(seedPath)) {
        logger.info(
          "Cargando semillas de datos iniciales (roles, administrador, planes, etc.)...",
        );
        const seedSql = fs.readFileSync(seedPath, "utf-8");
        await client.query(seedSql);
        logger.info("Semillas cargadas exitosamente.");
      } else {
        logger.warn(
          `Archivo de semillas no encontrado en: ${seedPath}, omitiendo datos iniciales.`,
        );
      }
    }

    logger.info("Base de datos inicializada correctamente.");
  } catch (error) {
    logger.error(
      { err: error },
      "Error crÃ­tico durante la inicializaciÃ³n de la base de datos",
    );
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

// EjecuciÃ³n directa si se llama por CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const shouldSeed = !process.argv.includes("--no-seed");
  runDatabaseInit({ seed: shouldSeed })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
