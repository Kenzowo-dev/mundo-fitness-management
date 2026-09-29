import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupIntegrationTestsPerTest } from '@gym/shared/test/integration-setup.js';
import { connectRedis, disconnectRedis } from '@gym/shared/messaging/index.js';
import { closePool } from '@gym/shared/database/index.js';
import clientRoutes from '../routes/client.routes.js';
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

app.use('/clients', authMiddleware, clientRoutes);
app.use(errorHandler);

setupIntegrationTestsPerTest();

let authToken: string;
let adminToken: string;

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
  authToken = await createTestUser('member');
  adminToken = await createTestUser('admin');
  await connectRedis();
}, 30000);

afterAll(async () => {
  await disconnectRedis();
  await closePool();
}, 10000);

describe('Client Service - Integration Tests', () => {
  describe('POST /clients', () => {
    it('should create a new client as admin', async () => {
      const response = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234567',
          firstName: 'Carlos',
          lastName: 'García',
          email: 'carlos.garcia@example.com',
          phone: '+51987654321',
          birthDate: '1990-05-15',
          gender: 'masculino',
          address: 'Av. Las Camelias 450',
          emergencyContactName: 'María García',
          emergencyContactPhone: '+51987654322',
          notes: 'Cliente VIP',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.dni).toBe('71234567');
      expect(response.body.firstName).toBe('Carlos');
      expect(response.body.email).toBe('carlos.garcia@example.com');
      expect(response.body.status).toBe('active');
    });

    it('should reject client creation without required fields', async () => {
      const response = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Carlos',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate DNI', async () => {
      await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234568',
          firstName: 'Carlos',
          lastName: 'García',
          email: 'carlos.garcia2@example.com',
        })
        .expect(201);

      const response = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234568',
          firstName: 'Carlos',
          lastName: 'García',
          email: 'carlos.garcia3@example.com',
        })
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('GET /clients', () => {
    beforeEach(async () => {
      await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234569',
          firstName: 'Ana',
          lastName: 'Martínez',
          email: 'ana.martinez@example.com',
          status: 'active',
        });
      await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234570',
          firstName: 'Pedro',
          lastName: 'López',
          email: 'pedro.lopez@example.com',
          status: 'inactive',
        });
    });

    it('should list clients with pagination', async () => {
      const response = await request(app)
        .get('/clients?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter clients by status', async () => {
      const response = await request(app)
        .get('/clients?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.every((c: any) => c.status === 'active')).toBe(true);
    });

    it('should search clients by name', async () => {
      const response = await request(app)
        .get('/clients?search=Ana')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.some((c: any) => c.firstName === 'Ana')).toBe(true);
    });
  });

  describe('GET /clients/:id', () => {
    let clientId: number;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234571',
          firstName: 'Luisa',
          lastName: 'Fernández',
          email: 'luisa.fernandez@example.com',
        });
      clientId = createRes.body.id;
    });

    it('should get client by id', async () => {
      const response = await request(app)
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(clientId);
      expect(response.body.dni).toBe('71234571');
      expect(response.body.firstName).toBe('Luisa');
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/clients/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /clients/:id', () => {
    let clientId: number;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234572',
          firstName: 'Miguel',
          lastName: 'Torres',
          email: 'miguel.torres@example.com',
        });
      clientId = createRes.body.id;
    });

    it('should update client', async () => {
      const response = await request(app)
        .put(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phone: '+51999888777',
          address: 'Nueva dirección 123',
        })
        .expect(200);

      expect(response.body.phone).toBe('+51999888777');
      expect(response.body.address).toBe('Nueva dirección 123');
    });
  });

  describe('DELETE /clients/:id', () => {
    let clientId: number;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234573',
          firstName: 'Eliminar',
          lastName: 'Test',
          email: 'eliminar.test@example.com',
        });
      clientId = createRes.body.id;
    });

    it('should delete client', async () => {
      await request(app)
        .delete(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const response = await request(app)
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /clients/:id/measurements', () => {
    let clientId: number;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234574',
          firstName: 'Medición',
          lastName: 'Test',
          email: 'medicion.test@example.com',
        });
      clientId = createRes.body.id;
    });

    it('should get client measurements', async () => {
      const response = await request(app)
        .get(`/clients/${clientId}/measurements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /clients/:id/measurements', () => {
    let clientId: number;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dni: '71234575',
          firstName: 'Nueva',
          lastName: 'Medición',
          email: 'nueva.medicion@example.com',
        });
      clientId = createRes.body.id;
    });

    it('should create client measurement', async () => {
      const response = await request(app)
        .post(`/clients/${clientId}/measurements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          weight: 75.5,
          height: 175,
          bodyFatPercentage: 18.5,
          muscleMass: 65.2,
          waistCircumference: 82,
          hipCircumference: 95,
          notes: 'Medición inicial',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.weight).toBe(75.5);
      expect(response.body.height).toBe(175);
    });
  });
});