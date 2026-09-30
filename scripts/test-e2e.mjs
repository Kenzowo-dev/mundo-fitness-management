import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const services = new Set([
  'postgres',
  'redis',
  'auth-service',
  'client-service',
  'membership-service',
  'payment-service',
  'api-gateway',
  'frontend',
]);

function getHealthyServices() {
  const result = spawnSync('docker', ['compose', '--env-file', '.env.docker', '-f', 'compose.yaml', '-f', 'compose.local.yaml', 'ps', '--format', 'json'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });

  if (result.error || result.status !== 0) {
    throw new Error('No se pudo consultar Docker Compose. Levanta el stack local con `pnpm docker:dev`.');
  }

  const healthy = new Set();
  for (const line of result.stdout.split(/\r?\n/).filter(Boolean)) {
    const container = JSON.parse(line);
    if (container.State === 'running' && container.Health === 'healthy') healthy.add(container.Service);
  }
  return healthy;
}

let runningServices = new Set();
const deadline = Date.now() + 120_000;
while (Date.now() < deadline) {
  runningServices = getHealthyServices();
  if ([...services].every((service) => runningServices.has(service))) break;
  await new Promise((resolveWait) => setTimeout(resolveWait, 2_000));
}

const unavailable = [...services].filter((service) => !runningServices.has(service));
if (unavailable.length > 0) {
  console.error(`Servicios Compose no saludables: ${unavailable.join(', ')}. Ejecuta pnpm docker:dev y vuelve a intentar.`);
  process.exit(1);
}

const result = spawnSync(pnpm, ['exec', 'playwright', 'test', '--project=chromium'], {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
