import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupIntegrationTestsPerTest } from '@gym/shared/test/integration-setup.js';
import { connectRedis, disconnectRedis } from '@gym/shared/messaging/index.js';
import { closePool } from '@gym/shared/database/index.js';
import membershipRoutes from '../routes/membership.routes.js';
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

app.use('/memberships', authMiddleware, membershipRoutes);
app.use(errorHandler);

setupIntegrationTestsPerTest();

let adminToken: string;
let memberToken: string;
let testClientId: number;
let testPlanId: number;

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
  memberToken = await createTestUser('member');
  
  const clientRes = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      dni: '71234580',
      firstName: 'Membresía',
      lastName: 'Test',
      email: 'membresia.test@example.com',
    });
  testClientId = clientRes.body.id;

  const planRes = await request(app)
    .post('/memberships/plans')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Plan Test',
      description: 'Plan para testing',
      price: 49.99,
      currency: 'USD',
      durationDays: 30,
      maxVisitsPerWeek: 5,
      includesPersonalTrainer: false,
      includesClasses: true,
      includesSauna: false,
      isActive: true,
    });
  testPlanId = planRes.body.id;

  await connectRedis();
}, 30000);

afterAll(async () => {
  await disconnectRedis();
  await closePool();
}, 10000);

describe('Membership Service - Integration Tests', () => {
  describe('POST /memberships/plans', () => {
    it('should create a membership plan as admin', async () => {
      const response = await request(app)
        .post('/memberships/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Plan Premium',
          description: 'Plan con todos los beneficios',
          price: 99.99,
          currency: 'USD',
          durationDays: 30,
          maxVisitsPerWeek: 7,
          includesPersonalTrainer: true,
          includesClasses: true,
          includesSauna: true,
          isActive: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Plan Premium');
      expect(response.body.price).toBe(99.99);
      expect(response.body.isActive).toBe(true);
    });

    it('should reject plan creation without required fields', async () => {
      const response = await request(app)
        .post('/memberships/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Plan',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /memberships/plans', () => {
    it('should list active membership plans', async () => {
      const response = await request(app)
        .get('/memberships/plans')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.every((p: any) => p.isActive === true)).toBe(true);
    });

    it('should list all plans when requested', async () => {
      const response = await request(app)
        .get('/memberships/plans?activeOnly=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('POST /memberships', () => {
    it('should create a client membership', async () => {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await request(app)
        .post('/memberships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          planId: testPlanId,
          startDate,
          endDate,
          status: 'active',
          autoRenew: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.clientId).toBe(testClientId);
      expect(response.body.planId).toBe(testPlanId);
      expect(response.body.status).toBe('active');
    });

    it('should reject membership without required fields', async () => {
      const response = await request(app)
        .post('/memberships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /memberships/client/:clientId', () => {
    it('should get client memberships', async () => {
      const response = await request(app)
        .get(`/memberships/client/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /memberships/check-in', () => {
    let membershipId: number;

    beforeEach(async () => {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const memRes = await request(app)
        .post('/memberships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          planId: testPlanId,
          startDate,
          endDate,
          status: 'active',
          autoRenew: true,
        });
      membershipId = memRes.body.id;
    });

    it('should register check-in successfully', async () => {
      const response = await request(app)
        .post('/memberships/check-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          membershipId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.clientId).toBe(testClientId);
      expect(response.body.visitType).toBe('check_in');
    });

    it('should reject check-in for inactive membership', async () => {
      await request(app)
        .put(`/memberships/${membershipId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' });

      const response = await request(app)
        .post('/memberships/check-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          membershipId,
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /memberships/check-out', () => {
    let membershipId: number;
    let visitId: number;

    beforeEach(async () => {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const memRes = await request(app)
        .post('/memberships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClientId,
          planId: testPlanId,
          startDate,
          endDate,
          status: 'active',
          autoRenew: true,
        });
      membershipId = memRes.body.id;

      const checkInRes = await request(app)
        .post('/memberships/check-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ clientId: testClientId, membershipId });
      visitId = checkInRes.body.id;
    });

    it('should register check-out successfully', async () => {
      const response = await request(app)
        .post(`/memberships/check-out/${visitId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.visitType).toBe('check_out');
    });
  });

  describe('GET /memberships/visits/:clientId', () => {
    it('should get client visit history', async () => {
      const response = await request(app)
        .get(`/memberships/visits/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});