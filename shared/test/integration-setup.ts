import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { pool, closePool } from '@gym/shared/database/index.js';
import { runDatabaseInit } from '@gym/shared/database/migrate.js';
import { config } from '@gym/shared/config/index.js';
import { logger } from '@gym/shared/logger/index.js';
import { beforeAll, afterAll, beforeEach } from 'vitest';

let pgContainer: StartedPostgreSqlContainer | null = null;
let redisContainer: StartedRedisContainer | null = null;

export interface TestContainers {
  postgres: StartedPostgreSqlContainer;
  redis: StartedRedisContainer;
}

export async function startTestContainers(): Promise<TestContainers> {
  logger.info('Starting test containers...');

  pgContainer = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase(config.postgres.database)
    .withUsername(config.postgres.user)
    .withPassword(config.postgres.password)
    .withExposedPorts(5432)
    .withHealthCheck({
      test: ['CMD-SHELL', 'pg_isready -U gym_user -d gym_db'],
      interval: 5000,
      timeout: 3000,
      retries: 5,
    })
    .start();

  redisContainer = await new RedisContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withHealthCheck({
      test: ['CMD', 'redis-cli', 'ping'],
      interval: 5000,
      timeout: 3000,
      retries: 5,
    })
    .start();

  process.env.POSTGRES_HOST = pgContainer.getHost();
  process.env.POSTGRES_PORT = String(pgContainer.getMappedPort(5432));
  process.env.POSTGRES_DB = config.postgres.database;
  process.env.POSTGRES_USER = config.postgres.user;
  process.env.POSTGRES_PASSWORD = config.postgres.password;

  process.env.REDIS_HOST = redisContainer.getHost();
  process.env.REDIS_PORT = String(redisContainer.getMappedPort(6379));

  logger.info({
    postgres: `${pgContainer.getHost()}:${pgContainer.getMappedPort(5432)}`,
    redis: `${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`,
  }, 'Test containers started');

  return { postgres: pgContainer, redis: redisContainer };
}

export async function stopTestContainers(): Promise<void> {
  logger.info('Stopping test containers...');
  
  if (pgContainer) {
    await pgContainer.stop();
    pgContainer = null;
  }
  if (redisContainer) {
    await redisContainer.stop();
    redisContainer = null;
  }
}

export async function initTestDatabase(): Promise<void> {
  logger.info('Initializing test database...');
  await runDatabaseInit({ seed: true });
  logger.info('Test database initialized');
}

export async function truncateAllTables(): Promise<void> {
  const client = await pool.connect();
  try {
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
    `);
    
    for (const row of tables.rows) {
      await client.query(`TRUNCATE TABLE "${row.tablename}" CASCADE`);
    }
  } finally {
    client.release();
  }
}

export async function closeTestDatabase(): Promise<void> {
  await closePool();
}

export function setupIntegrationTests() {
  beforeAll(async () => {
    await startTestContainers();
    await initTestDatabase();
  }, 120000);

  afterAll(async () => {
    await closeTestDatabase();
    await stopTestContainers();
  }, 30000);
}

export function setupIntegrationTestsPerTest() {
  beforeAll(async () => {
    await startTestContainers();
    await initTestDatabase();
  }, 120000);

  afterAll(async () => {
    await closeTestDatabase();
    await stopTestContainers();
  }, 30000);

  beforeEach(async () => {
    await truncateAllTables();
  }, 30000);
}

export function getTestDbConfig() {
  return {
    host: process.env.POSTGRES_HOST!,
    port: Number(process.env.POSTGRES_PORT!),
    database: process.env.POSTGRES_DB!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
  };
}

export function getTestRedisConfig() {
  return {
    host: process.env.REDIS_HOST!,
    port: Number(process.env.REDIS_PORT!),
  };
}