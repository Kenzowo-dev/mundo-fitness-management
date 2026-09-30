import { describe, expect, it } from 'vitest';
import { validateSecuritySettings, type SecuritySettings } from '../config/security.js';

const localSettings: SecuritySettings = {
  nodeEnv: 'development',
  jwtSecret: 'local-only-change-this-secret-before-sharing',
  postgresPassword: 'gym_password',
  redisPassword: undefined,
  corsOrigins: ['http://localhost:5173'],
};

describe('validateSecuritySettings', () => {
  it('allows explicitly local-only development credentials', () => {
    expect(() => validateSecuritySettings(localSettings)).not.toThrow();
  });

  it('rejects a short JWT secret in every environment', () => {
    expect(() => validateSecuritySettings({ ...localSettings, jwtSecret: 'too-short' })).toThrow(/32 characters/);
  });

  it('rejects wildcard or empty CORS origin lists', () => {
    expect(() => validateSecuritySettings({ ...localSettings, corsOrigins: ['*'] })).toThrow(/explicit origins/);
    expect(() => validateSecuritySettings({ ...localSettings, corsOrigins: [] })).toThrow(/explicit origins/);
  });

  it('rejects local placeholder secrets and weak database credentials in production', () => {
    const production = {
      ...localSettings,
      nodeEnv: 'production',
      redisPassword: 'some-secure-redis-password',
      corsOrigins: ['https://gym.example.com'],
    };
    expect(() => validateSecuritySettings(production)).toThrow(/JWT_SECRET/);
    expect(() => validateSecuritySettings({ ...production, jwtSecret: 'a'.repeat(40) })).toThrow(/POSTGRES_PASSWORD/);
  });

  it('requires Redis authentication and HTTPS origins in production', () => {
    const production: SecuritySettings = {
      nodeEnv: 'production',
      jwtSecret: 'a'.repeat(40),
      postgresPassword: 'private-postgres-password',
      redisPassword: undefined,
      corsOrigins: ['https://gym.example.com'],
    };
    expect(() => validateSecuritySettings(production)).toThrow(/REDIS_PASSWORD/);
    expect(() => validateSecuritySettings({ ...production, redisPassword: 'private-redis-password', corsOrigins: ['http://gym.example.com'] })).toThrow(/HTTPS/);
  });

  it('accepts private production settings with HTTPS origins', () => {
    expect(() => validateSecuritySettings({
      nodeEnv: 'production',
      jwtSecret: 'a'.repeat(40),
      postgresPassword: 'private-postgres-password',
      redisPassword: 'private-redis-password',
      corsOrigins: ['https://gym.example.com'],
    })).not.toThrow();
  });
});
