export interface SecuritySettings {
  nodeEnv: string;
  jwtSecret: string;
  postgresPassword: string;
  redisPassword?: string;
  corsOrigins: string[];
}

export function validateSecuritySettings(settings: SecuritySettings): void {
  const { nodeEnv, jwtSecret, postgresPassword, redisPassword, corsOrigins } = settings;

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  if (corsOrigins.length === 0 || corsOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN must contain one or more explicit origins; wildcard origins are not allowed.');
  }

  if (nodeEnv !== 'production') return;

  if (jwtSecret === 'local-only-change-this-secret-before-sharing') {
    throw new Error('JWT_SECRET must be replaced with a private production secret.');
  }
  if (postgresPassword === 'gym_password' || postgresPassword.length < 16) {
    throw new Error('POSTGRES_PASSWORD must be a private value of at least 16 characters in production.');
  }
  if (!redisPassword || redisPassword.length < 16) {
    throw new Error('REDIS_PASSWORD must be a private value of at least 16 characters in production.');
  }
  if (corsOrigins.some((origin) => !origin.startsWith('https://'))) {
    throw new Error('CORS_ORIGIN must use HTTPS origins in production.');
  }
}
