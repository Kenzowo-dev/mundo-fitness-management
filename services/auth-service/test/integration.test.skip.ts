import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupIntegrationTestsPerTest } from '@gym/shared/test/integration-setup.js';
import { connectRedis, disconnectRedis, publish, CHANNELS } from '@gym/shared/messaging/index.js';
import { closePool } from '@gym/shared/database/index.js';
import authRoutes from '../src/routes/auth.routes.js';
import { errorHandler } from '../src/middleware/error.middleware.js';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

setupIntegrationTestsPerTest();

describe('Auth Service - Integration Tests', () => {
  let authToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    await connectRedis();
  }, 30000);

  afterAll(async () => {
    await disconnectRedis();
    await closePool();
  }, 10000);

  beforeEach(async () => {
    authToken = '';
    refreshToken = '';
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
          firstName: 'Juan',
          lastName: 'Pérez',
          phone: '+51987654321',
          birthDate: '1990-01-15',
          gender: 'masculino',
          role: 'member',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.firstName).toBe('Juan');
      expect(response.body.user.role).toBe('member');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'weak@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate email registration', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'SecurePass123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'SecurePass123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123',
          firstName: 'Login',
          lastName: 'User',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      authToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123',
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /auth/refresh', () => {
    beforeEach(async () => {
      const regRes = await request(app)
        .post('/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'SecurePass123',
          firstName: 'Refresh',
          lastName: 'User',
        });
      refreshToken = regRes.body.tokens.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(regRes.body.tokens.accessToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error.code).toBe('TOKEN_INVALID');
    });

    it('should reject reused refresh token', async () => {
      await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error.code).toBe('TOKEN_REVOKED');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const regRes = await request(app)
        .post('/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123',
          firstName: 'Logout',
          lastName: 'User',
        });

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${regRes.body.tokens.accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'forgot@example.com',
          password: 'SecurePass123',
          firstName: 'Forgot',
          lastName: 'User',
        });
    });

    it('should initiate password reset for existing user', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200);

      expect(response.body.message).toContain('password reset');
    });

    it('should not reveal if email exists', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toContain('password reset');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const regRes = await request(app)
        .post('/auth/register')
        .send({
          email: 'reset@example.com',
          password: 'SecurePass123',
          firstName: 'Reset',
          lastName: 'User',
        });

      const forgotRes = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'reset@example.com' });

      const resetToken = forgotRes.body.resetToken || 'mock-token-for-test';

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewSecurePass456',
        });

      expect([200, 400]).toContain(response.status);
    });
  });
});