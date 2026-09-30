import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query, publish } = vi.hoisted(() => ({ query: vi.fn(), publish: vi.fn() }));
vi.mock('@gym/shared/database/index.js', () => ({ query, transaction: vi.fn() }));
vi.mock('@gym/shared/messaging/index.js', () => ({ publish, CHANNELS: { PAYMENT_COMPLETED: 'payment.completed' } }));

import { createPayment, updatePayment } from '../src/services/payment.service.js';

const now = new Date('2026-09-29T12:00:00.000Z');
const paymentRow = {
  id: 501,
  client_id: 22,
  membership_id: 71,
  amount: '149.90',
  currency: 'PEN',
  status: 'completed',
  payment_method: 'cash',
  transaction_id: null,
  gateway_response: null,
  description: 'Pago de membresía',
  paid_at: now,
  failed_at: null,
  failure_reason: null,
  refunded_at: null,
  refund_amount: null,
  refund_reason: null,
  metadata: null,
  created_at: now,
  updated_at: now,
};

describe('createPayment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('records a received payment for the selected client membership', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 22 }] })
      .mockResolvedValueOnce({ rows: [{ id: 71 }] })
      .mockResolvedValueOnce({ rows: [paymentRow] });

    const result = await createPayment({
      clientId: 22,
      membershipId: 71,
      amount: 149.9,
      currency: 'PEN',
      paymentMethod: 'cash',
    });

    expect(result.status).toBe('completed');
    expect(result.paidAt).toEqual(now);
    expect(result.membershipId).toBe(71);
    const [insertSql, values] = query.mock.calls[2];
    expect(insertSql).toContain("'completed', NOW()");
    expect(values).toEqual([22, 71, 149.9, 'PEN', 'cash', null, null, null]);
    expect(publish).toHaveBeenCalledWith('payment.completed', {
      paymentId: 501,
      membershipId: 71,
      clientId: 22,
      amount: 149.9,
    });
  });

  it('rejects a membership owned by a different client without inserting a payment', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 22 }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(createPayment({
      clientId: 22,
      membershipId: 71,
      amount: 149.9,
      paymentMethod: 'cash',
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', message: 'La membresía seleccionada no pertenece al socio.', details: { field: 'membershipId' } });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('returns a not found error for an unknown client', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(createPayment({
      clientId: 404,
      membershipId: 71,
      amount: 149.9,
      paymentMethod: 'cash',
    })).rejects.toMatchObject({ statusCode: 404 });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns a conflict when a transaction reference is reused', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 22 }] })
      .mockResolvedValueOnce({ rows: [{ id: 71 }] })
      .mockRejectedValueOnce({ code: '23505' });

    await expect(createPayment({
      clientId: 22,
      membershipId: 71,
      amount: 149.9,
      paymentMethod: 'bank_transfer',
      transactionId: 'transfer-123',
    })).rejects.toMatchObject({ code: 'PAYMENT_REFERENCE_EXISTS', statusCode: 409 });
  });

  it('does not allow changing a completed payment to cancelled outside the refund flow', async () => {
    query.mockResolvedValueOnce({ rows: [paymentRow] });

    await expect(updatePayment(501, { status: 'cancelled' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Solo un pago pendiente puede confirmarse, marcarse fallido o cancelarse.',
    });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('confirms a pending payment and publishes completion once', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ ...paymentRow, status: 'pending', paid_at: null }] })
      .mockResolvedValueOnce({ rows: [paymentRow] });

    const result = await updatePayment(501, { status: 'completed' });

    expect(result.status).toBe('completed');
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith('payment.completed', {
      paymentId: 501,
      membershipId: 71,
      clientId: 22,
      amount: 149.9,
    });
  });
});
