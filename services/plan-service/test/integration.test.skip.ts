import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupIntegrationTestsPerTest } from '@gym/shared/test/integration-setup.js';
import { connectRedis, disconnectRedis } from '@gym/shared/messaging/index.js';
import { closePool } from '@gym/shared/database/index.js';
import planRoutes from '../routes/plan.routes.js';
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

app.use('/plans', authMiddleware, planRoutes);
app.use(errorHandler);

setupIntegrationTestsPerTest();

let adminToken: string;
let trainerToken: string;
let memberToken: string;
let testClientId: number;
let testExerciseId: number;

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
  trainerToken = await createTestUser('trainer');
  memberToken = await createTestUser('member');
  
  const clientRes = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      dni: '71234600',
      firstName: 'Plan',
      lastName: 'Test',
      email: 'plan.test@example.com',
    });
  testClientId = clientRes.body.id;

  const exerciseRes = await request(app)
    .post('/plans/exercises')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Sentadilla con barra',
      description: 'Ejercicio compuesto para piernas',
      muscleGroup: 'legs',
      secondaryMuscles: ['glutes', 'core'],
      equipment: 'Barra olímpica',
      difficulty: 'intermediate',
      instructions: 'Colocar la barra en los trapecios, bajar hasta 90 grados',
      videoUrl: 'https://example.com/squat.mp4',
    });
  testExerciseId = exerciseRes.body.id;

  await connectRedis();
}, 30000);

afterAll(async () => {
  await disconnectRedis();
  await closePool();
}, 10000);

describe('Plan Service - Integration Tests', () => {
  describe('POST /plans/exercises', () => {
    it('should create an exercise as admin', async () => {
      const response = await request(app)
        .post('/plans/exercises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Press de banca',
          description: 'Ejercicio compuesto para pecho',
          muscleGroup: 'chest',
          secondaryMuscles: ['triceps', 'shoulders'],
          equipment: 'Barra olímpica y banco',
          difficulty: 'intermediate',
          instructions: 'Acostado en banco plano, bajar barra al pecho y subir',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Press de banca');
      expect(response.body.muscleGroup).toBe('chest');
    });

    it('should reject exercise without required fields', async () => {
      const response = await request(app)
        .post('/plans/exercises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /plans/exercises', () => {
    it('should list exercises', async () => {
      const response = await request(app)
        .get('/plans/exercises')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter exercises by muscle group', async () => {
      const response = await request(app)
        .get('/plans/exercises?muscleGroup=legs')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.every((e: any) => e.muscleGroup === 'legs')).toBe(true);
    });
  });

  describe('POST /plans', () => {
    it('should create a workout plan as trainer', async () => {
      const response = await request(app)
        .post('/plans')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          name: 'Plan Fuerza Básica',
          description: 'Plan de fuerza para principiantes',
          goal: 'strength',
          difficulty: 'beginner',
          durationWeeks: 8,
          daysPerWeek: 3,
          isPublic: false,
          days: [
            {
              dayNumber: 1,
              focus: 'Pecho y Tríceps',
              exercises: [
                { exerciseId: testExerciseId, sets: 3, reps: 10, weightPercentage: 65, restSeconds: 90, order: 1 },
              ],
            },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Plan Fuerza Básica');
      expect(response.body.goal).toBe('strength');
      expect(response.body.days).toHaveLength(1);
    });

    it('should reject plan without required fields', async () => {
      const response = await request(app)
        .post('/plans')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          name: 'Incomplete Plan',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /plans', () => {
    it('should list workout plans', async () => {
      const response = await request(app)
        .get('/plans')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter public plans only', async () => {
      const response = await request(app)
        .get('/plans?publicOnly=true')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.every((p: any) => p.isPublic === true)).toBe(true);
    });
  });

  describe('POST /plans/:id/assign', () => {
    let planId: number;

    beforeEach(async () => {
      const planRes = await request(app)
        .post('/plans')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          name: 'Plan Asignación',
          description: 'Plan para test de asignación',
          goal: 'hypertrophy',
          difficulty: 'intermediate',
          durationWeeks: 12,
          daysPerWeek: 4,
          isPublic: true,
          days: [],
        });
      planId = planRes.body.id;
    });

    it('should assign plan to client', async () => {
      const response = await request(app)
        .post(`/plans/${planId}/assign`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          clientId: testClientId,
          assignedBy: 1,
          startDate: new Date().toISOString().split('T')[0],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.clientId).toBe(testClientId);
      expect(response.body.planId).toBe(planId);
      expect(response.body.status).toBe('active');
    });
  });

  describe('POST /plans/logs', () => {
    let clientPlanId: number;
    let planDayId: number;

    beforeEach(async () => {
      const planRes = await request(app)
        .post('/plans')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          name: 'Plan Logs',
          description: 'Plan para test de logs',
          goal: 'endurance',
          difficulty: 'beginner',
          durationWeeks: 4,
          daysPerWeek: 2,
          isPublic: true,
          days: [
            {
              dayNumber: 1,
              focus: 'Cardio',
              exercises: [
                { exerciseId: testExerciseId, sets: 3, reps: 15, weightPercentage: 50, restSeconds: 60, order: 1 },
              ],
            },
          ],
        });
      
      const assignRes = await request(app)
        .post(`/plans/${planRes.body.id}/assign`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          clientId: testClientId,
          assignedBy: 1,
          startDate: new Date().toISOString().split('T')[0],
        });
      
      clientPlanId = assignRes.body.id;
      planDayId = assignRes.body.days[0].id;
    });

    it('should log a workout', async () => {
      const response = await request(app)
        .post('/plans/logs')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          clientPlanId,
          clientId: testClientId,
          planDayId,
          durationMinutes: 45,
          notes: 'Buen entrenamiento',
          rating: 4,
          exercises: [
            {
              planExerciseId: 1,
              setsCompleted: 3,
              repsCompleted: [10, 10, 8],
              weightsUsed: [50, 55, 60],
              rpe: 7,
              notes: 'Última serie difícil',
            },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.durationMinutes).toBe(45);
      expect(response.body.rating).toBe(4);
    });
  });

  describe('GET /plans/logs/:clientPlanId', () => {
    it('should get workout logs for client plan', async () => {
      const response = await request(app)
        .get(`/plans/logs/${testClientId}`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});