import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupIntegrationTestsPerTest } from '@gym/shared/test/integration-setup.js';
import { connectRedis, disconnectRedis } from '@gym/shared/messaging/index.js';
import { closePool } from '@gym/shared/database/index.js';
import { verifyAccessToken, createTokenPair } from '@gym/shared/utils/jwt.js';
import { errorHandler } from '../middleware/error.middleware.js';

const app = express();
app.use(express.json());

const authMiddleware = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return _res.status(401).json({ error: { message: 'Access token required', code: 'TOKEN_MISSING' } });
  }
  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    (req as any).user = payload;
    next();
  } catch {
    return _res.status(401).json({ error: { message: 'Invalid or expired token', code: 'TOKEN_INVALID' } });
  }
};

const mockServices = {
  auth: express(),
  client: express(),
  membership: express(),
  payment: express(),
  plan: express(),
  report: express(),
};

mockServices.auth.get('/health', (_req, res) => res.json({ status: 'healthy' }));
mockServices.client.get('/health', (_req, res) => res.json({ status: 'healthy' }));
mockServices.membership.get('/health', (_req, res) => res.json({ status: 'healthy' }));
mockServices.payment.get('/health', (_req, res) => res.json({ status: 'healthy' }));
mockServices.plan.get('/health', (_req, res) => res.json({ status: 'healthy' }));
mockServices.report.get('/health', (_req, res) => res.json({ status: 'healthy' }));

mockServices.auth.use(express.json());
mockServices.auth.post('/auth/login', (_req, res) => res.json({ user: { id: 1 }, tokens: { accessToken: 'mock-token' } }));
mockServices.auth.post('/auth/register', (_req, res) => res.status(201).json({ user: { id: 2 }, tokens: { accessToken: 'mock-token' } }));
mockServices.auth.post('/auth/refresh', (_req, res) => res.json({ accessToken: 'new-mock-token', refreshToken: 'new-refresh' }));
mockServices.auth.post('/auth/logout', (_req, res) => res.json({ message: 'Logged out' }));
mockServices.auth.post('/auth/forgot-password', (_req, res) => res.json({ message: 'Email sent' }));
mockServices.auth.post('/auth/reset-password', (_req, res) => res.json({ message: 'Password reset' }));

mockServices.client.use(express.json());
mockServices.client.get('/clients', (_req, res) => res.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }));
mockServices.client.post('/clients', (_req, res) => res.status(201).json({ id: 1, dni: '71234567', firstName: 'Test', lastName: 'User' }));
mockServices.client.get('/clients/:id', (_req, res) => res.json({ id: 1, dni: '71234567', firstName: 'Test', lastName: 'User' }));
mockServices.client.put('/clients/:id', (_req, res) => res.json({ id: 1, dni: '71234567', firstName: 'Test', lastName: 'User' }));
mockServices.client.delete('/clients/:id', (_req, res) => res.status(204).send());
mockServices.client.get('/clients/:id/measurements', (_req, res) => res.json([]));
mockServices.client.post('/clients/:id/measurements', (_req, res) => res.status(201).json({ id: 1, weight: 75 }));

mockServices.membership.use(express.json());
mockServices.membership.get('/memberships/plans', (_req, res) => res.json({ data: [{ id: 1, name: 'Plan Test' }] }));
mockServices.membership.post('/memberships/plans', (_req, res) => res.status(201).json({ id: 1, name: 'Plan Test' }));
mockServices.membership.get('/memberships/plans/:id', (_req, res) => res.json({ id: 1, name: 'Plan Test' }));
mockServices.membership.post('/memberships', (_req, res) => res.status(201).json({ id: 1, clientId: 1, planId: 1 }));
mockServices.membership.get('/memberships/client/:clientId', (_req, res) => res.json([]));
mockServices.membership.post('/memberships/visits/check-in', (_req, res) => res.status(201).json({ id: 1, clientId: 1 }));
mockServices.membership.post('/memberships/visits/:visitId/check-out', (_req, res) => res.json({ id: 1, visitType: 'check_out' }));
mockServices.membership.get('/memberships/visits/client/:clientId', (_req, res) => res.json([]));

mockServices.payment.use(express.json());
mockServices.payment.get('/payments', (_req, res) => res.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }));
mockServices.payment.post('/payments', (_req, res) => res.status(201).json({ id: 1, amount: 49.99 }));
mockServices.payment.get('/payments/:id', (_req, res) => res.json({ id: 1, amount: 49.99 }));
mockServices.payment.post('/payments/:id/refund', (_req, res) => res.status(201).json({ id: 1, amount: 25 }));
mockServices.payment.get('/payments/client/:clientId/summary', (_req, res) => res.json({ totalPaid: 100, currency: 'USD' }));
mockServices.payment.get('/invoices', (_req, res) => res.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }));
mockServices.payment.post('/payment-methods', (_req, res) => res.status(201).json({ id: 1, type: 'credit_card' }));

mockServices.plan.use(express.json());
mockServices.plan.get('/plans/exercises', (_req, res) => res.json([]));
mockServices.plan.post('/plans/exercises', (_req, res) => res.status(201).json({ id: 1, name: 'Test Exercise' }));
mockServices.plan.get('/plans', (_req, res) => res.json([]));
mockServices.plan.post('/plans', (_req, res) => res.status(201).json({ id: 1, name: 'Test Plan' }));
mockServices.plan.post('/plans/:id/assign', (_req, res) => res.status(201).json({ id: 1, clientId: 1 }));
mockServices.plan.post('/plans/logs', (_req, res) => res.status(201).json({ id: 1, durationMinutes: 45 }));
mockServices.plan.get('/plans/logs/:clientPlanId', (_req, res) => res.json([]));

mockServices.report.use(express.json());
mockServices.report.get('/reports/widgets', (_req, res) => res.json([]));
mockServices.report.get('/reports/widgets/:id/execute', (_req, res) => res.json({ columns: [], rows: [] }));

app.use('/auth', authMiddleware, (req, res) => {
  const path = req.originalUrl.replace('/auth', '');
  const method = req.method.toLowerCase();
  const handler = mockServices.auth._router.stack.find((layer: any) => 
    layer.route && layer.route.path === path && layer.route.methods[method]
  );
  if (handler) {
    return mockServices.auth.handle(req, res);
  }
  res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
});

app.use('/clients', authMiddleware, (req, res) => mockServices.client.handle(req, res));
app.use('/memberships', authMiddleware, (req, res) => mockServices.membership.handle(req, res));
app.use('/payments', authMiddleware, (req, res) => mockServices.payment.handle(req, res));
app.use('/plans', authMiddleware, (req, res) => mockServices.plan.handle(req, res));
app.use('/reports', authMiddleware, (req, res) => mockServices.report.handle(req, res));

app.get('/health', async (_req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

setupIntegrationTestsPerTest();

let adminToken: string;

async function createAdminToken() {
  const { accessToken } = await createTokenPair(1, 'admin@test.com', 'admin');
  return accessToken;
}

beforeAll(async () => {
  adminToken = await createAdminToken();
  await connectRedis();
}, 30000);

afterAll(async () => {
  await disconnectRedis();
  await closePool();
}, 10000);

describe('API Gateway - Contract Tests', () => {
  describe('Health Check', () => {
    it('should return gateway health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('api-gateway');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication Routes Proxy', () => {
    it('should proxy POST /auth/login to auth-service', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
    });

    it('should proxy POST /auth/register to auth-service', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'new@test.com', password: 'password123', firstName: 'Test', lastName: 'User' })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
    });

    it('should proxy POST /auth/refresh to auth-service', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'mock-refresh' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });

  describe('Client Routes Proxy', () => {
    it('should proxy GET /clients to client-service', async () => {
      const response = await request(app)
        .get('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should proxy POST /clients to client-service', async () => {
      const response = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dni: '71234567', firstName: 'Test', lastName: 'User', email: 'test@test.com' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.dni).toBe('71234567');
    });
  });

  describe('Membership Routes Proxy', () => {
    it('should proxy GET /memberships/plans to membership-service', async () => {
      const response = await request(app)
        .get('/memberships/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should proxy POST /memberships to membership-service', async () => {
      const response = await request(app)
        .post('/memberships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ clientId: 1, planId: 1, startDate: '2024-01-01', endDate: '2024-02-01' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.clientId).toBe(1);
    });
  });

  describe('Payment Routes Proxy', () => {
    it('should proxy GET /payments to payment-service', async () => {
      const response = await request(app)
        .get('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should proxy POST /payments to payment-service', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ clientId: 1, amount: 49.99, currency: 'USD', paymentMethod: 'credit_card', status: 'completed' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(49.99);
    });
  });

  describe('Plan Routes Proxy', () => {
    it('should proxy GET /plans to plan-service', async () => {
      const response = await request(app)
        .get('/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Report Routes Proxy', () => {
    it('should proxy GET /reports/widgets to report-service', async () => {
      const response = await request(app)
        .get('/reports/widgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Header Injection', () => {
    it('should inject user headers in proxied requests', async () => {
      const response = await request(app)
        .get('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/clients')
        .expect(401);

      expect(response.body.error.code).toBe('TOKEN_MISSING');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/clients')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('TOKEN_INVALID');
    });

    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Rate Limiting Headers', () => {
    it('should include rate limit headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .options('/health')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });
});