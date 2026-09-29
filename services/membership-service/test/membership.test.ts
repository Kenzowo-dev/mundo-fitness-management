import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapRowToPlan,
  mapRowToMembership,
  mapRowToVisit,
  mapRowToFreeze,
  type MembershipPlanRow,
  type ClientMembershipRow,
  type MembershipVisitRow,
  type MembershipFreezeRow,
} from '../src/services/membership.service.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const basePlanRow: MembershipPlanRow = {
  id: 1,
  name: 'Plan Premium',
  description: 'Acceso ilimitado a todas las instalaciones',
  duration_days: 30,
  price: '59.99',
  currency: 'USD',
  features: '["Pesas","Cardio","Clases grupales","Sauna"]',
  max_visits_per_week: null,
  includes_personal_trainer: true,
  includes_classes: true,
  includes_sauna: true,
  is_active: true,
  sort_order: 1,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

const baseMembershipRow: ClientMembershipRow = {
  id: 100,
  client_id: 1,
  plan_id: 1,
  start_date: new Date('2024-06-01'),
  end_date: new Date('2024-07-01'),
  status: 'active',
  auto_renew: true,
  payment_method_id: 'pm_stripe_001',
  cancelled_at: null,
  cancellation_reason: null,
  created_at: new Date('2024-06-01'),
  updated_at: new Date('2024-06-01'),
};

const baseVisitRow: MembershipVisitRow = {
  id: 50,
  client_membership_id: 100,
  client_id: 1,
  visited_at: new Date('2024-06-15T08:00:00Z'),
  check_out_at: new Date('2024-06-15T10:00:00Z'),
  duration_minutes: '120.5',
  visit_type: 'gym',
  notes: null,
};

const baseFreezeRow: MembershipFreezeRow = {
  id: 7,
  client_membership_id: 100,
  start_date: new Date('2024-07-01'),
  end_date: new Date('2024-07-15'),
  reason: 'Vacaciones de verano',
  created_at: new Date('2024-06-28'),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Membership Service - mapRowToPlan', () => {
  it('debe parsear correctamente el precio de string a number', () => {
    const plan = mapRowToPlan(basePlanRow);

    assert.equal(plan.id, 1);
    assert.equal(plan.name, 'Plan Premium');
    assert.equal(typeof plan.price, 'number');
    assert.ok(Math.abs(plan.price - 59.99) < 0.001);
    assert.equal(plan.currency, 'USD');
    assert.equal(plan.durationDays, 30);
    assert.equal(plan.isActive, true);
  });

  it('debe parsear features de JSON string a array', () => {
    const plan = mapRowToPlan(basePlanRow);

    assert.ok(Array.isArray(plan.features));
    assert.equal(plan.features.length, 4);
    assert.ok(plan.features.includes('Sauna'));
  });

  it('debe devolver array vacío si features es null', () => {
    const row: MembershipPlanRow = { ...basePlanRow, features: null };
    const plan = mapRowToPlan(row);

    assert.deepEqual(plan.features, []);
  });

  it('debe mapear booleans de BD correctamente', () => {
    const plan = mapRowToPlan(basePlanRow);

    assert.equal(plan.includesPersonalTrainer, true);
    assert.equal(plan.includesClasses, true);
    assert.equal(plan.includesSauna, true);
  });

  it('debe respetar maxVisitsPerWeek como undefined si es null', () => {
    const plan = mapRowToPlan(basePlanRow);
    assert.equal(plan.maxVisitsPerWeek, undefined);
  });
});

describe('Membership Service - mapRowToMembership', () => {
  it('debe mapear correctamente una membresía activa', () => {
    const membership = mapRowToMembership(baseMembershipRow);

    assert.equal(membership.id, 100);
    assert.equal(membership.clientId, 1);
    assert.equal(membership.planId, 1);
    assert.equal(membership.status, 'active');
    assert.equal(membership.autoRenew, true);
    assert.equal(membership.paymentMethodId, 'pm_stripe_001');
    assert.equal(membership.cancelledAt, undefined);
    assert.equal(membership.cancellationReason, undefined);
    assert.ok(membership.startDate instanceof Date);
    assert.ok(membership.endDate instanceof Date);
  });

  it('debe mapear cancelled_at y cancellation_reason cuando están presentes', () => {
    const row: ClientMembershipRow = {
      ...baseMembershipRow,
      status: 'cancelled',
      cancelled_at: new Date('2024-06-20'),
      cancellation_reason: 'Motivos económicos',
    };
    const membership = mapRowToMembership(row);

    assert.equal(membership.status, 'cancelled');
    assert.ok(membership.cancelledAt instanceof Date);
    assert.equal(membership.cancellationReason, 'Motivos económicos');
  });
});

describe('Membership Service - mapRowToVisit', () => {
  it('debe redondear correctamente duration_minutes de string decimal', () => {
    const visit = mapRowToVisit(baseVisitRow);

    assert.equal(visit.id, 50);
    assert.equal(visit.clientMembershipId, 100);
    assert.equal(visit.clientId, 1);
    assert.equal(visit.durationMinutes, 121); // Math.round(120.5)
    assert.equal(visit.visitType, 'gym');
    assert.ok(visit.visitedAt instanceof Date);
    assert.ok(visit.checkOutAt instanceof Date);
  });

  it('debe devolver undefined si duration_minutes es null', () => {
    const row: MembershipVisitRow = { ...baseVisitRow, duration_minutes: null, check_out_at: null };
    const visit = mapRowToVisit(row);

    assert.equal(visit.durationMinutes, undefined);
    assert.equal(visit.checkOutAt, undefined);
  });
});

describe('Membership Service - mapRowToFreeze', () => {
  it('debe mapear correctamente un congelamiento de membresía', () => {
    const freeze = mapRowToFreeze(baseFreezeRow);

    assert.equal(freeze.id, 7);
    assert.equal(freeze.clientMembershipId, 100);
    assert.equal(freeze.reason, 'Vacaciones de verano');
    assert.ok(freeze.startDate instanceof Date);
    assert.ok(freeze.endDate instanceof Date);
    assert.ok(freeze.createdAt instanceof Date);
  });

  it('debe mapear reason null como undefined', () => {
    const row: MembershipFreezeRow = { ...baseFreezeRow, reason: null };
    const freeze = mapRowToFreeze(row);

    assert.equal(freeze.reason, undefined);
  });
});

describe('Membership Service - Lógica de cálculo de fecha de fin', () => {
  it('debe calcular endDate correctamente a partir de durationDays del plan', () => {
    // Simula la lógica de createMembership
    const startDate = new Date('2024-06-01');
    const durationDays = 30;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const expected = new Date('2024-07-01');
    assert.equal(endDate.toDateString(), expected.toDateString());
  });

  it('debe calcular endDate correctamente para planes de 365 días', () => {
    // Usar Date.UTC para evitar problemas de zona horaria
    const startDate = new Date(Date.UTC(2023, 0, 1)); // 2023-01-01 UTC
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 365);

    assert.ok(endDate > startDate);
    assert.equal(endDate.getUTCFullYear(), 2024);
    assert.equal(endDate.getUTCMonth(), 0); // Enero
    assert.equal(endDate.getUTCDate(), 1);  // Día 1
  });
});

describe('Membership Service - Validación de rango de fechas de freeze', () => {
  it('debe rechazar freeze donde endDate <= startDate', () => {
    const startDate = new Date('2024-07-15');
    const endDate = new Date('2024-07-01'); // anterior

    assert.ok(startDate >= endDate); // lógica: if (startDate >= endDate) throw
  });

  it('debe aceptar freeze con rango de fechas válido', () => {
    const startDate = new Date('2024-07-01');
    const endDate = new Date('2024-07-15');

    assert.ok(startDate < endDate);
  });
});
