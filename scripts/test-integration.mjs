import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
let postgres;
let redis;
let exitCode = 1;

function run(command, args, env) {
  const result = spawnSync(command, args, { cwd: projectRoot, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

try {
  postgres = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('gym_integration')
    .withUsername('gym_integration')
    .withPassword('gym_integration_only')
    .start();
  redis = await new RedisContainer('redis:7-alpine').start();

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: '3001',
    POSTGRES_HOST: postgres.getHost(),
    POSTGRES_PORT: String(postgres.getMappedPort(5432)),
    POSTGRES_DB: 'gym_integration',
    POSTGRES_USER: 'gym_integration',
    POSTGRES_PASSWORD: 'gym_integration_only',
    POSTGRES_SSL: 'false',
    REDIS_HOST: redis.getHost(),
    REDIS_PORT: String(redis.getMappedPort(6379)),
    REDIS_DB: '0',
    REDIS_PASSWORD: '',
    JWT_SECRET: 'integration-only-secret-not-for-deployment',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  };

  console.log('Initializing disposable PostgreSQL schema and seed...');
  run(pnpm, ['--filter=@gym/shared', 'exec', 'tsx', 'database/migrate.ts'], env);

  console.log('Running service integration tests against disposable PostgreSQL and Redis...');
  run(pnpm, [
    '--filter=auth-service',
    'exec',
    'vitest',
    'run',
    '--config',
    resolve(projectRoot, 'services/auth-service/vitest.integration.config.ts'),
  ], env);
  exitCode = 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  await Promise.allSettled([redis?.stop(), postgres?.stop()]);
}

process.exitCode = exitCode;
