import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@gym/shared/database/index.js', () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

import { query } from '@gym/shared/database/index.js';
import { listMemberships } from '../src/services/membership.service.js';

describe('listMemberships', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads every subscription and its plan in one ordered database query', async () => {
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{
        id: 12,
        client_id: 7,
        plan_id: 3,
        start_date: new Date('2026-09-01'),
        end_date: new Date('2026-10-01'),
        status: 'active',
        auto_renew: true,
        payment_method_id: null,
        cancelled_at: null,
        cancellation_reason: null,
        created_at: new Date('2026-09-01'),
        updated_at: new Date('2026-09-01'),
        name: 'Plan mensual',
        description: null,
        duration_days: 30,
        price: '59.90',
        currency: 'PEN',
        features: '["Acceso general"]',
        max_visits_per_week: null,
        includes_personal_trainer: false,
        includes_classes: true,
        includes_sauna: false,
      }],
      rowCount: 1,
    } as never);

    const memberships = await listMemberships();

    expect(query).toHaveBeenCalledOnce();
    expect(query.mock.calls[0][0]).toContain('JOIN membership_plans');
    expect(query.mock.calls[0][0]).toContain('ORDER BY cm.created_at DESC, cm.id DESC');
    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({
      id: 12,
      clientId: 7,
      plan: { id: 3, name: 'Plan mensual', price: 59.9, currency: 'PEN' },
    });
  });
});
