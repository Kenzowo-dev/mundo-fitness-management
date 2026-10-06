import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('@gym/shared/database/index.js', () => ({ query: vi.fn(), transaction: vi.fn() }));

import { query } from '@gym/shared/database/index.js';
import router from '../src/routes/membership.routes.js';
import { errorHandler } from '../src/middleware/error.middleware.js';
import type { MembershipPlanRow } from '../src/services/membership.service.js';

const activePlan: MembershipPlanRow = {
  id: 1, name: 'Mensual', description: 'Acceso al gimnasio', duration_days: 30,
  price: '90.00', currency: 'PEN', features: '["Acceso general"]', max_visits_per_week: null,
  includes_personal_trainer: false, includes_classes: true, includes_sauna: false,
  is_active: true, sort_order: 1, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01'),
};

const app = express();
app.use('/api/memberships', router);
app.use(errorHandler);

describe('public plan catalog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows anonymous reads, always filters active plans, and projects only marketing fields', async () => {
    vi.mocked(query).mockResolvedValueOnce({ rows: [activePlan], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

    const response = await request(app).get('/api/memberships/plans/public?activeOnly=false');

    expect(response.status).toBe(200);
    expect(query.mock.calls[0][0]).toContain('WHERE is_active = true');
    expect(response.body).toEqual([{
      id: 1, name: 'Mensual', description: 'Acceso al gimnasio', durationDays: 30,
      price: 90, currency: 'PEN', features: ['Acceso general'], includesClasses: true, includesSauna: false,
    }]);
  });

  it.each(['/plans', '/plans/1', '/stats', '/requests', '/'])('keeps %s protected', async (path) => {
    const response = await request(app).get(`/api/memberships${path}`);
    expect(response.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it('does not expose a public plan-detail route', async () => {
    const response = await request(app).get('/api/memberships/plans/public/1');
    expect(response.status).toBe(404);
    expect(query).not.toHaveBeenCalled();
  });
});
