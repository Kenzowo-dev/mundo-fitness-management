import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupIntegrationTestsPerTest } from '@gym/shared/test/integration-setup.js';
import { connectRedis, disconnectRedis } from '@gym/shared/messaging/index.js';
import { closePool } from '@gym/shared/database/index.js';
import paymentRoutes from '../routes/payment.routes.js';
import { errorHandler } from '../middleware/error.middleware.js';
import { verifyAccessToken } from '@gym/shared/utils/jwt.js';

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

app.use('/payments', authMiddleware, paymentRoutes);
app.use(errorHandler);

setupIntegrationTestsPerTest();

let adminToken: string;
let testClientId: number;
let testMembershipId: number;

async function createTestUser(role = 'member') {
  const regRes = await request(app)
    .post('/auth/register')
    .send({
      email: `${role}-${Date.now()}@example.com`,
      password: 'SecurePass123',
      firstName: role.charAt(0).toUpperCase() + role.slice(1),
      lastName: 'Test',
      role,
    });
  return regRes.body.tokens.accessToken;
}

beforeAll(async () => {
  adminToken = await createTestUser('admin');
  
  const clientRes = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      dni: '71234590',
      firstName: 'Pago',
      lastName: 'Test',
      email: 'pago.test@example.com',
    });
  testClientId = clientRes.body.id;

  await connectRedis();
}, 30000);

afterAll(async () => {
  await disconnectRedis();
  await closePool();
}, 10000);

describe('Payment Service - Integration Tests', () => {
  describe('POST /payments', () => {
    it('should create a payment successfully', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          amount: 49.99,
          currency: 'USD',
          paymentMethod: 'credit_card',
          status: 'completed',
          description: 'Pago mensualidad Plan Test',
          transactionId: `TX-${Date.now()}`,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(49.99);
      expect(response.body.currency).toBe('USD');
      expect(response.body.status).toBe('completed');
      expect(response.body.transactionId).toMatch(/^TX-\d+$/);
    });

    it('should reject payment without required fields', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject negative amount', async () => {
      const response = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          amount: -10,
          currency: 'USD',
          paymentMethod: 'credit_card',
          status: 'completed',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /payments', () => {
    beforeEach(async () => {
      await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          amount: 29.99,
          currency: 'USD',
          paymentMethod: 'cash',
          status: 'completed',
          description: 'Pago parcial',
        });
    });

    it('should list payments with pagination', async () => {
      const response = await request(app)
        .get('/payments?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter payments by client', async () => {
      const response = await request(app)
        .get(`/payments?clientId=${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.every((p: any) => p.clientId === testClientId)).toBe(true);
    });

    it('should filter payments by status', async () => {
      const response = await request(app)
        .get('/payments?status=completed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.every((p: any) => p.status === 'completed')).toBe(true);
    });
  });

  describe('GET /payments/:id', () => {
    let paymentId: number;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          amount: 99.99,
          currency: 'USD',
          paymentMethod: 'bank_transfer',
          status: 'completed',
          description: 'Pago anual',
        });
      paymentId = createRes.body.id;
    });

    it('should get payment by id', async () => {
      const response = await request(app)
        .get(`/payments/${paymentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(paymentId);
      expect(response.body.amount).toBe(99.99);
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .get('/payments/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /payments/:id/refund', () => {
    let paymentId: number;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          amount: 100.00,
          currency: 'USD',
          paymentMethod: 'credit_card',
          status: 'completed',
          description: 'Pago para reembolso',
        });
      paymentId = createRes.body.id;
    });

    it('should create a refund for completed payment', async () => {
      const response = await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 50.00,
          reason: 'Solicitud del cliente',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(50.00);
      expect(response.body.status).toBe('completed');
    });

    it('should reject refund exceeding payment amount', async () => {
      const response = await request(app)
        .post(`/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 150.00,
          reason: 'Monto inválido',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject refund for non-completed payment', async () => {
      const failedRes = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          amount: 50.00,
          currency: 'USD',
          paymentMethod: 'credit_card',
          status: 'failed',
          description: 'Pago fallido',
        });

      const response = await request(app)
        .post(`/payments/${failedRes.body.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 25.00,
          reason: 'Intento de reembolso',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /payments/client/:clientId/summary', () => {
    it('should get client payment summary', async () => {
      const response = await request(app)
        .get(`/payments/client/${testClientId}/summary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalPaid');
      expect(response.body).toHaveProperty('totalPending');
      expect(response.body).toHaveProperty('totalOverdue');
      expect(response.body).toHaveProperty('currency');
    });
  });

  describe('GET /invoices', () => {
    it('should list invoices', async () => {
      const response = await request(app)
        .get('/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /payment-methods', () => {
    it('should create a payment method', async () => {
      const response = await request(app)
        .post('/payment-methods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          type: 'credit_card',
          token: 'tok_visa_1234',
          isDefault: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('credit_card');
      expect(response.body.isDefault).toBe(true);
    });
  });
});