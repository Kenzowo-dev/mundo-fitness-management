import { query, transaction } from '@gym/shared/database/index.js';
import { publish } from '@gym/shared/messaging/index.js';
import { CHANNELS } from '@gym/shared/messaging/index.js';
import {
  MembershipPlan,
  CreatePlanData,
  UpdatePlanData,
  ClientMembership,
  CreateMembershipData,
  UpdateMembershipData,
  MembershipVisit,
  CreateVisitData,
  MembershipFreeze,
  CreateFreezeData,
} from '../models/membership.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '@gym/shared/errors/index.js';

export interface MembershipPlanRow {
  id: number;
  name: string;
  description: string | null;
  duration_days: number;
  price: string | number;
  currency: string;
  features: string[] | string | null;
  max_visits_per_week: number | null;
  includes_personal_trainer: boolean;
  includes_classes: boolean;
  includes_sauna: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface ClientMembershipRow {
  id: number;
  client_id: number;
  plan_id: number;
  start_date: Date;
  end_date: Date;
  status: string;
  auto_renew: boolean;
  payment_method_id: string | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MembershipVisitRow {
  id: number;
  client_membership_id: number;
  client_id: number;
  visited_at: Date;
  check_out_at: Date | null;
  duration_minutes: number | string | null;
  visit_type: string;
  notes: string | null;
}

export interface MembershipFreezeRow {
  id: number;
  client_membership_id: number;
  start_date: Date;
  end_date: Date;
  reason: string | null;
  created_at: Date;
}

export interface MembershipWithPlanRow extends ClientMembershipRow {
  name: string;
  description: string | null;
  duration_days: number;
  price: string | number;
  currency: string;
  features: string[] | string | null;
  max_visits_per_week: number | null;
  includes_personal_trainer?: boolean;
  includes_classes?: boolean;
  includes_sauna?: boolean;
}

function parseFeatures(features: unknown): string[] {
  if (Array.isArray(features)) return features as string[];
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function mapRowToPlan(row: MembershipPlanRow): MembershipPlan {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    durationDays: row.duration_days,
    price: typeof row.price === 'number' ? row.price : parseFloat(row.price),
    currency: row.currency,
    features: parseFeatures(row.features),
    maxVisitsPerWeek: row.max_visits_per_week ?? undefined,
    includesPersonalTrainer: Boolean(row.includes_personal_trainer),
    includesClasses: Boolean(row.includes_classes),
    includesSauna: Boolean(row.includes_sauna),
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToMembership(row: ClientMembershipRow): ClientMembership {
  return {
    id: row.id,
    clientId: row.client_id,
    planId: row.plan_id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    status: row.status,
    autoRenew: Boolean(row.auto_renew),
    paymentMethodId: row.payment_method_id ?? undefined,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
    cancellationReason: row.cancellation_reason ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToVisit(row: MembershipVisitRow): MembershipVisit {
  return {
    id: row.id,
    clientMembershipId: row.client_membership_id,
    clientId: row.client_id,
    visitedAt: new Date(row.visited_at),
    checkOutAt: row.check_out_at ? new Date(row.check_out_at) : undefined,
    durationMinutes: row.duration_minutes != null ? Math.round(Number(row.duration_minutes)) : undefined,
    visitType: row.visit_type,
    notes: row.notes ?? undefined,
  };
}

export function mapRowToFreeze(row: MembershipFreezeRow): MembershipFreeze {
  return {
    id: row.id,
    clientMembershipId: row.client_membership_id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    reason: row.reason ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function createPlan(data: CreatePlanData): Promise<MembershipPlan> {
  const result = await query<MembershipPlanRow>(
    `
    INSERT INTO membership_plans (name, description, duration_days, price, currency, features, max_visits_per_week, includes_personal_trainer, includes_classes, includes_sauna, sort_order)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
    `,
    [
      data.name,
      data.description ?? null,
      data.durationDays,
      data.price,
      data.currency ?? 'USD',
      JSON.stringify(data.features ?? []),
      data.maxVisitsPerWeek ?? null,
      data.includesPersonalTrainer ?? false,
      data.includesClasses ?? false,
      data.includesSauna ?? false,
      data.sortOrder ?? 0,
    ]
  );
  return mapRowToPlan(result.rows[0]);
}

export async function getPlanById(id: number): Promise<MembershipPlan | null> {
  const result = await query<MembershipPlanRow>('SELECT * FROM membership_plans WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapRowToPlan(result.rows[0]) : null;
}

export async function listPlans(activeOnly = true): Promise<MembershipPlan[]> {
  const where = activeOnly ? 'WHERE is_active = true' : '';
  const result = await query<MembershipPlanRow>(`SELECT * FROM membership_plans ${where} ORDER BY sort_order, price`);
  return result.rows.map(mapRowToPlan);
}

export async function updatePlan(id: number, data: UpdatePlanData): Promise<MembershipPlan> {
  const existing = await getPlanById(id);
  if (!existing) throw new NotFoundError('MembershipPlan', id);

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    durationDays: 'duration_days',
    price: 'price',
    currency: 'currency',
    features: 'features',
    maxVisitsPerWeek: 'max_visits_per_week',
    includesPersonalTrainer: 'includes_personal_trainer',
    includesClasses: 'includes_classes',
    includesSauna: 'includes_sauna',
    isActive: 'is_active',
    sortOrder: 'sort_order',
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    const value = data[key as keyof UpdatePlanData];
    if (value !== undefined) {
      fields.push(`${dbField} = $${paramIndex++}`);
      values.push(key === 'features' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) return existing;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<MembershipPlanRow>(
    `UPDATE membership_plans SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return mapRowToPlan(result.rows[0]);
}

export async function deletePlan(id: number): Promise<void> {
  const memberships = await query('SELECT id FROM client_memberships WHERE plan_id = $1', [id]);
  if (memberships.rows.length > 0) {
    throw new ConflictError('Cannot delete plan with active memberships', 'PLAN_HAS_MEMBERSHIPS');
  }
  await query('DELETE FROM membership_plans WHERE id = $1', [id]);
}

export async function createMembership(data: CreateMembershipData): Promise<ClientMembership> {
  const plan = await getPlanById(data.planId);
  if (!plan) throw new NotFoundError('MembershipPlan', data.planId);

  const activeMembership = await query(
    `SELECT id FROM client_memberships WHERE client_id = $1 AND status = 'active' AND end_date >= CURRENT_DATE`,
    [data.clientId]
  );
  if (activeMembership.rows.length > 0) {
    throw new ConflictError('Client already has an active membership', 'ACTIVE_MEMBERSHIP_EXISTS');
  }

  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const result = await query<ClientMembershipRow>(
    `
    INSERT INTO client_memberships (client_id, plan_id, start_date, end_date, auto_renew, payment_method_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [data.clientId, data.planId, startDate, endDate, data.autoRenew ?? true, data.paymentMethodId ?? null]
  );

  const membership = mapRowToMembership(result.rows[0]);
  membership.plan = plan;
  await publish(CHANNELS.MEMBERSHIP_CREATED, { membershipId: membership.id, clientId: membership.clientId, planId: membership.planId });
  return membership;
}

export async function getMembershipById(id: number): Promise<ClientMembership | null> {
  const result = await query<MembershipWithPlanRow>(
    `SELECT cm.*, mp.name, mp.description, mp.duration_days, mp.price, mp.currency, mp.features,
            mp.max_visits_per_week, mp.includes_personal_trainer, mp.includes_classes, mp.includes_sauna
     FROM client_memberships cm
     JOIN membership_plans mp ON cm.plan_id = mp.id
     WHERE cm.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const membership = mapRowToMembership(row);
  membership.plan = {
    id: row.plan_id,
    name: row.name,
    description: row.description ?? undefined,
    durationDays: row.duration_days,
    price: typeof row.price === 'number' ? row.price : parseFloat(row.price),
    currency: row.currency,
    features: parseFeatures(row.features),
    maxVisitsPerWeek: row.max_visits_per_week ?? undefined,
    includesPersonalTrainer: Boolean(row.includes_personal_trainer),
    includesClasses: Boolean(row.includes_classes),
    includesSauna: Boolean(row.includes_sauna),
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
  return membership;
}

export async function getClientMemberships(clientId: number): Promise<ClientMembership[]> {
  const result = await query<MembershipWithPlanRow>(
    `SELECT cm.*, mp.name, mp.description, mp.duration_days, mp.price, mp.currency, mp.features,
            mp.max_visits_per_week, mp.includes_personal_trainer, mp.includes_classes, mp.includes_sauna
     FROM client_memberships cm
     JOIN membership_plans mp ON cm.plan_id = mp.id
     WHERE cm.client_id = $1
     ORDER BY cm.created_at DESC`,
    [clientId]
  );
  return result.rows.map((row) => {
    const membership = mapRowToMembership(row);
    membership.plan = {
      id: row.plan_id,
      name: row.name,
      description: row.description ?? undefined,
      durationDays: row.duration_days,
      price: typeof row.price === 'number' ? row.price : parseFloat(row.price),
      currency: row.currency,
      features: parseFeatures(row.features),
      maxVisitsPerWeek: row.max_visits_per_week ?? undefined,
      includesPersonalTrainer: Boolean(row.includes_personal_trainer),
      includesClasses: Boolean(row.includes_classes),
      includesSauna: Boolean(row.includes_sauna),
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    return membership;
  });
}

export async function updateMembership(id: number, data: UpdateMembershipData): Promise<ClientMembership> {
  const existing = await getMembershipById(id);
  if (!existing) throw new NotFoundError('ClientMembership', id);

  if (data.status === 'cancelled' && existing.status !== 'cancelled') {
    return await cancelMembership(id, data.cancellationReason);
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.planId !== undefined) {
    const plan = await getPlanById(data.planId);
    if (!plan) throw new NotFoundError('MembershipPlan', data.planId);
    fields.push(`plan_id = $${paramIndex++}`);
    values.push(data.planId);
  }
  if (data.autoRenew !== undefined) {
    fields.push(`auto_renew = $${paramIndex++}`);
    values.push(data.autoRenew);
  }
  if (data.paymentMethodId !== undefined) {
    fields.push(`payment_method_id = $${paramIndex++}`);
    values.push(data.paymentMethodId);
  }
  if (data.status !== undefined && data.status !== 'cancelled') {
    fields.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }

  if (fields.length === 0) return existing;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<ClientMembershipRow>(
    `UPDATE client_memberships SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return mapRowToMembership(result.rows[0]);
}

export async function cancelMembership(id: number, reason?: string): Promise<ClientMembership> {
  const result = await query<ClientMembershipRow>(
    `UPDATE client_memberships SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [reason ?? null, id]
  );
  if (result.rows.length === 0) throw new NotFoundError('ClientMembership', id);
  const membership = mapRowToMembership(result.rows[0]);
  await publish(CHANNELS.MEMBERSHIP_CANCELLED, { membershipId: membership.id, clientId: membership.clientId });
  return membership;
}

export async function renewMembership(id: number): Promise<ClientMembership> {
  return await transaction(async (client) => {
    const membershipResult = await client.query<ClientMembershipRow & { duration_days: number }>(
      `SELECT cm.*, mp.duration_days FROM client_memberships cm JOIN membership_plans mp ON cm.plan_id = mp.id WHERE cm.id = $1`,
      [id]
    );
    if (membershipResult.rows.length === 0) throw new NotFoundError('ClientMembership', id);

    const membership = membershipResult.rows[0];
    const newEndDate = new Date(membership.end_date);
    newEndDate.setDate(newEndDate.getDate() + membership.duration_days);

    const result = await client.query<ClientMembershipRow>(
      `UPDATE client_memberships SET end_date = $1, status = 'active', cancelled_at = NULL, cancellation_reason = NULL, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newEndDate, id]
    );
    const renewed = mapRowToMembership(result.rows[0]);
    await publish(CHANNELS.MEMBERSHIP_UPDATED, { membershipId: renewed.id, clientId: renewed.clientId });
    return renewed;
  });
}

export async function checkIn(data: CreateVisitData): Promise<MembershipVisit> {
  const membership = await getMembershipById(data.clientMembershipId);
  if (!membership) throw new NotFoundError('ClientMembership', data.clientMembershipId);
  if (membership.status !== 'active') throw new ValidationError('Membership is not active', 'MEMBERSHIP_INACTIVE');
  if (new Date() > new Date(membership.endDate)) throw new ValidationError('Membership has expired', 'MEMBERSHIP_EXPIRED');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayVisits = await query(
    `SELECT id FROM membership_visits WHERE client_id = $1 AND visited_at BETWEEN $2 AND $3`,
    [data.clientId, todayStart, todayEnd]
  );
  if (todayVisits.rows.length > 0) {
    throw new ConflictError('Client already checked in today', 'ALREADY_CHECKED_IN');
  }

  const result = await query<MembershipVisitRow>(
    `INSERT INTO membership_visits (client_membership_id, client_id, visit_type, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.clientMembershipId, data.clientId, data.visitType ?? 'gym', data.notes ?? null]
  );
  return mapRowToVisit(result.rows[0]);
}

export async function checkOut(visitId: number): Promise<MembershipVisit> {
  const result = await query<MembershipVisitRow>(
    `UPDATE membership_visits SET check_out_at = NOW(), duration_minutes = EXTRACT(EPOCH FROM (NOW() - visited_at))/60 WHERE id = $1 AND check_out_at IS NULL RETURNING *`,
    [visitId]
  );
  if (result.rows.length === 0) throw new NotFoundError('Visit', visitId);
  return mapRowToVisit(result.rows[0]);
}

export async function getClientVisits(clientId: number, limit = 50): Promise<MembershipVisit[]> {
  const result = await query<MembershipVisitRow>(
    `SELECT * FROM membership_visits WHERE client_id = $1 ORDER BY visited_at DESC LIMIT $2`,
    [clientId, limit]
  );
  return result.rows.map(mapRowToVisit);
}

export async function createFreeze(data: CreateFreezeData): Promise<MembershipFreeze> {
  const membership = await getMembershipById(data.clientMembershipId);
  if (!membership) throw new NotFoundError('ClientMembership', data.clientMembershipId);
  if (membership.status !== 'active') throw new ValidationError('Can only freeze active memberships', 'MEMBERSHIP_NOT_ACTIVE');

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (startDate >= endDate) throw new ValidationError('End date must be after start date', 'INVALID_DATE_RANGE');

  const result = await query<MembershipFreezeRow>(
    `INSERT INTO membership_freezes (client_membership_id, start_date, end_date, reason) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.clientMembershipId, startDate, endDate, data.reason ?? null]
  );
  return mapRowToFreeze(result.rows[0]);
}

export async function getMembershipFreezes(clientMembershipId: number): Promise<MembershipFreeze[]> {
  const result = await query<MembershipFreezeRow>(
    `SELECT * FROM membership_freezes WHERE client_membership_id = $1 ORDER BY start_date`,
    [clientMembershipId]
  );
  return result.rows.map(mapRowToFreeze);
}

export async function getExpiringMemberships(days = 7): Promise<ClientMembership[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const result = await query<MembershipWithPlanRow>(
    `SELECT cm.*, mp.name, mp.description, mp.duration_days, mp.price, mp.currency, mp.features,
            mp.max_visits_per_week, mp.includes_personal_trainer, mp.includes_classes, mp.includes_sauna
     FROM client_memberships cm
     JOIN membership_plans mp ON cm.plan_id = mp.id
     WHERE cm.status = 'active' AND cm.auto_renew = true AND cm.end_date BETWEEN CURRENT_DATE AND $1`,
    [futureDate]
  );
  return result.rows.map((row) => {
    const membership = mapRowToMembership(row);
    membership.plan = {
      id: row.plan_id,
      name: row.name,
      description: row.description ?? undefined,
      durationDays: row.duration_days,
      price: typeof row.price === 'number' ? row.price : parseFloat(row.price),
      currency: row.currency,
      features: parseFeatures(row.features),
      maxVisitsPerWeek: row.max_visits_per_week ?? undefined,
      includesPersonalTrainer: Boolean(row.includes_personal_trainer),
      includesClasses: Boolean(row.includes_classes),
      includesSauna: Boolean(row.includes_sauna),
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    return membership;
  });
}