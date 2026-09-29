import { query, transaction } from '@gym/shared/database/index.js';
import { publish } from '@gym/shared/messaging/index.js';
import { CHANNELS } from '@gym/shared/messaging/index.js';
import {
  Payment,
  CreatePaymentData,
  UpdatePaymentData,
  Invoice,
  CreateInvoiceData,
  PaymentMethod,
  CreatePaymentMethodData,
  Refund,
  CreateRefundData,
} from '../models/payment.js';
import {
  ValidationError,
  NotFoundError,
} from '@gym/shared/errors/index.js';

import { InvoiceItem } from '../models/payment.js';

export interface PaymentRow {
  id: number;
  client_id: number;
  membership_id: number | null;
  amount: string | number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_id: string | null;
  gateway_response: Record<string, unknown> | string | null;
  description: string | null;
  paid_at: Date | null;
  failed_at: Date | null;
  failure_reason: string | null;
  refunded_at: Date | null;
  refund_amount: string | number | null;
  refund_reason: string | null;
  metadata: Record<string, unknown> | string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceRow {
  id: number;
  client_id: number;
  membership_id: number | null;
  invoice_number: string;
  amount: string | number;
  currency: string;
  status: string;
  due_date: Date;
  paid_at: Date | null;
  cancelled_at: Date | null;
  items: InvoiceItem[] | string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentMethodRow {
  id: number;
  client_id: number;
  type: string;
  provider: string | null;
  provider_token: string | null;
  last_four: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RefundRow {
  id: number;
  payment_id: number;
  amount: string | number;
  reason: string | null;
  status: string;
  processed_at: Date | null;
  gateway_response: Record<string, unknown> | string | null;
  created_at: Date;
}

export interface CountRow {
  count: string;
}

export interface PaymentsSummaryRow {
  total_paid: string;
  total_pending: string;
  total_refunded: string;
  payment_count: string;
}

function parseRecord(val: unknown): Record<string, unknown> | undefined {
  if (val == null) return undefined;
  if (typeof val === 'object' && !Array.isArray(val)) return val as Record<string, unknown>;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function parseArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function mapRowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    clientId: row.client_id,
    membershipId: row.membership_id ?? undefined,
    amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount),
    currency: row.currency,
    status: row.status,
    paymentMethod: row.payment_method,
    transactionId: row.transaction_id ?? undefined,
    gatewayResponse: parseRecord(row.gateway_response),
    description: row.description ?? undefined,
    paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
    failedAt: row.failed_at ? new Date(row.failed_at) : undefined,
    failureReason: row.failure_reason ?? undefined,
    refundedAt: row.refunded_at ? new Date(row.refunded_at) : undefined,
    refundAmount: row.refund_amount != null ? (typeof row.refund_amount === 'number' ? row.refund_amount : parseFloat(row.refund_amount)) : undefined,
    refundReason: row.refund_reason ?? undefined,
    metadata: parseRecord(row.metadata),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    clientId: row.client_id,
    membershipId: row.membership_id ?? undefined,
    invoiceNumber: row.invoice_number,
    amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount),
    currency: row.currency,
    status: row.status,
    dueDate: new Date(row.due_date),
    paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
    items: parseArray<InvoiceItem>(row.items),
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToPaymentMethod(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    clientId: row.client_id,
    type: row.type,
    provider: row.provider ?? undefined,
    providerToken: row.provider_token ?? undefined,
    lastFour: row.last_four ?? undefined,
    expiryMonth: row.expiry_month ?? undefined,
    expiryYear: row.expiry_year ?? undefined,
    isDefault: Boolean(row.is_default),
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToRefund(row: RefundRow): Refund {
  return {
    id: row.id,
    paymentId: row.payment_id,
    amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount),
    reason: row.reason ?? undefined,
    status: row.status,
    processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
    gatewayResponse: parseRecord(row.gateway_response),
    createdAt: new Date(row.created_at),
  };
}

export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  const result = await query<PaymentRow>(
    `
    INSERT INTO payments (client_id, membership_id, amount, currency, payment_method, transaction_id, description, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      data.clientId,
      data.membershipId ?? null,
      data.amount,
      data.currency ?? 'USD',
      data.paymentMethod,
      data.transactionId ?? null,
      data.description ?? null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );
  return mapRowToPayment(result.rows[0]);
}

export async function getPaymentById(id: number): Promise<Payment | null> {
  const result = await query<PaymentRow>('SELECT * FROM payments WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapRowToPayment(result.rows[0]) : null;
}

export async function getPaymentByTransactionId(transactionId: string): Promise<Payment | null> {
  const result = await query<PaymentRow>('SELECT * FROM payments WHERE transaction_id = $1', [transactionId]);
  return result.rows.length > 0 ? mapRowToPayment(result.rows[0]) : null;
}

export async function updatePayment(id: number, data: UpdatePaymentData): Promise<Payment> {
  const existing = await getPaymentById(id);
  if (!existing) throw new NotFoundError('Payment', id);

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(data.status);
    if (data.status === 'completed' && !existing.paidAt) {
      fields.push(`paid_at = NOW()`);
    } else if (data.status === 'failed' && !existing.failedAt) {
      fields.push(`failed_at = NOW()`);
    }
  }
  if (data.gatewayResponse !== undefined) {
    fields.push(`gateway_response = $${paramIndex++}`);
    values.push(JSON.stringify(data.gatewayResponse));
  }
  if (data.failureReason !== undefined) {
    fields.push(`failure_reason = $${paramIndex++}`);
    values.push(data.failureReason);
  }

  if (fields.length === 0) return existing;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<PaymentRow>(
    `UPDATE payments SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  const payment = mapRowToPayment(result.rows[0]);
  if (payment.status === 'completed') {
    await publish(CHANNELS.PAYMENT_COMPLETED, {
      paymentId: payment.id,
      membershipId: payment.membershipId ?? null,
      clientId: payment.clientId,
      amount: payment.amount,
    });
  } else if (payment.status === 'failed') {
    await publish(CHANNELS.PAYMENT_FAILED, { paymentId: payment.id, clientId: payment.clientId, reason: payment.failureReason });
  }
  return payment;
}

export async function listPayments(
  page: number,
  limit: number,
  filters?: { clientId?: number; membershipId?: number; status?: string }
): Promise<{ payments: Payment[]; total: number }> {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (filters?.clientId) {
    conditions.push(`client_id = $${paramIndex++}`);
    values.push(filters.clientId);
  }
  if (filters?.membershipId) {
    conditions.push(`membership_id = $${paramIndex++}`);
    values.push(filters.membershipId);
  }
  if (filters?.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [paymentsResult, countResult] = await Promise.all([
    query<PaymentRow>(
      `SELECT * FROM payments ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    ),
    query<CountRow>(`SELECT COUNT(*) FROM payments ${whereClause}`, values),
  ]);

  return {
    payments: paymentsResult.rows.map(mapRowToPayment),
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function createInvoice(data: CreateInvoiceData): Promise<Invoice> {
  const invoiceNumberResult = await query<{ invoice_number: string }>('SELECT generate_invoice_number() as invoice_number');
  const invoiceNumber = invoiceNumberResult.rows[0].invoice_number;

  const result = await query<InvoiceRow>(
    `
    INSERT INTO invoices (client_id, membership_id, invoice_number, amount, currency, due_date, items, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      data.clientId,
      data.membershipId ?? null,
      invoiceNumber,
      data.amount,
      data.currency ?? 'USD',
      data.dueDate,
      JSON.stringify(data.items),
      data.notes ?? null,
    ]
  );
  return mapRowToInvoice(result.rows[0]);
}

export async function getInvoiceById(id: number): Promise<Invoice | null> {
  const result = await query<InvoiceRow>('SELECT * FROM invoices WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapRowToInvoice(result.rows[0]) : null;
}

export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
  const result = await query<InvoiceRow>('SELECT * FROM invoices WHERE invoice_number = $1', [invoiceNumber]);
  return result.rows.length > 0 ? mapRowToInvoice(result.rows[0]) : null;
}

export async function listInvoices(
  page: number,
  limit: number,
  filters?: { clientId?: number; status?: string }
): Promise<{ invoices: Invoice[]; total: number }> {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (filters?.clientId) {
    conditions.push(`client_id = $${paramIndex++}`);
    values.push(filters.clientId);
  }
  if (filters?.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [invoicesResult, countResult] = await Promise.all([
    query<InvoiceRow>(
      `SELECT * FROM invoices ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    ),
    query<CountRow>(`SELECT COUNT(*) FROM invoices ${whereClause}`, values),
  ]);

  return {
    invoices: invoicesResult.rows.map(mapRowToInvoice),
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function markInvoicePaid(id: number): Promise<Invoice> {
  const result = await query<InvoiceRow>(
    `UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Invoice', id);
  return mapRowToInvoice(result.rows[0]);
}

export async function cancelInvoice(id: number): Promise<Invoice> {
  const result = await query<InvoiceRow>(
    `UPDATE invoices SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Invoice', id);
  return mapRowToInvoice(result.rows[0]);
}

export async function createPaymentMethod(data: CreatePaymentMethodData): Promise<PaymentMethod> {
  if (data.isDefault) {
    await query('UPDATE payment_methods SET is_default = false WHERE client_id = $1', [data.clientId]);
  }

  const result = await query<PaymentMethodRow>(
    `
    INSERT INTO payment_methods (client_id, type, provider, provider_token, last_four, expiry_month, expiry_year, is_default)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      data.clientId,
      data.type,
      data.provider ?? null,
      data.providerToken ?? null,
      data.lastFour ?? null,
      data.expiryMonth ?? null,
      data.expiryYear ?? null,
      data.isDefault ?? false,
    ]
  );
  return mapRowToPaymentMethod(result.rows[0]);
}

export async function getClientPaymentMethods(clientId: number): Promise<PaymentMethod[]> {
  const result = await query<PaymentMethodRow>(
    `SELECT * FROM payment_methods WHERE client_id = $1 AND is_active = true ORDER BY is_default DESC, created_at DESC`,
    [clientId]
  );
  return result.rows.map(mapRowToPaymentMethod);
}

export async function setDefaultPaymentMethod(clientId: number, methodId: number): Promise<void> {
  await transaction(async (client) => {
    await client.query('UPDATE payment_methods SET is_default = false WHERE client_id = $1', [clientId]);
    await client.query('UPDATE payment_methods SET is_default = true WHERE id = $1 AND client_id = $2', [methodId, clientId]);
  });
}

export async function deactivatePaymentMethod(clientId: number, methodId: number): Promise<void> {
  await query('UPDATE payment_methods SET is_active = false, is_default = false WHERE id = $1 AND client_id = $2', [methodId, clientId]);
}

export async function createRefund(data: CreateRefundData): Promise<Refund> {
  const payment = await getPaymentById(data.paymentId);
  if (!payment) throw new NotFoundError('Payment', data.paymentId);
  if (payment.status !== 'completed') throw new ValidationError('Can only refund completed payments', 'INVALID_PAYMENT_STATUS');
  if (data.amount > payment.amount) throw new ValidationError('Refund amount cannot exceed payment amount', 'INVALID_REFUND_AMOUNT');

  const existingRefunds = await query<{ total: string }>('SELECT COALESCE(SUM(amount), 0) as total FROM refunds WHERE payment_id = $1 AND status = $2', [data.paymentId, 'completed']);
  const totalRefunded = parseFloat(existingRefunds.rows[0].total);
  if (totalRefunded + data.amount > payment.amount) {
    throw new ValidationError('Total refunds would exceed payment amount', 'REFUND_EXCEEDS_PAYMENT');
  }

  const result = await query<RefundRow>(
    `INSERT INTO refunds (payment_id, amount, reason) VALUES ($1, $2, $3) RETURNING *`,
    [data.paymentId, data.amount, data.reason ?? null]
  );
  return mapRowToRefund(result.rows[0]);
}

export async function processRefund(refundId: number): Promise<Refund> {
  return await transaction(async (client) => {
    const refundResult = await client.query<RefundRow>('SELECT * FROM refunds WHERE id = $1', [refundId]);
    if (refundResult.rows.length === 0) throw new NotFoundError('Refund', refundId);
    const refund = mapRowToRefund(refundResult.rows[0]);

    const paymentResult = await client.query<PaymentRow>('SELECT * FROM payments WHERE id = $1', [refund.paymentId]);
    if (paymentResult.rows.length === 0) throw new NotFoundError('Payment', refund.paymentId);
    const payment = mapRowToPayment(paymentResult.rows[0]);

    await client.query('UPDATE refunds SET status = $1, processed_at = NOW() WHERE id = $2', ['completed', refundId]);

    const existingRefunds = await client.query<{ total: string }>('SELECT COALESCE(SUM(amount), 0) as total FROM refunds WHERE payment_id = $1 AND status = $2', [payment.id, 'completed']);
    const totalRefunded = parseFloat(existingRefunds.rows[0].total);

    if (totalRefunded >= payment.amount) {
      await client.query('UPDATE payments SET status = $1, refunded_at = NOW(), refund_amount = $2 WHERE id = $3', ['refunded', payment.amount, payment.id]);
    } else {
      await client.query('UPDATE payments SET refund_amount = $1 WHERE id = $2', [totalRefunded, payment.id]);
    }

    await publish(CHANNELS.PAYMENT_REFUNDED, { paymentId: payment.id, refundId: refund.id, amount: refund.amount });
    return { ...refund, status: 'completed', processedAt: new Date() };
  });
}

export async function getClientPaymentsSummary(clientId: number): Promise<{
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  paymentCount: number;
}> {
  const result = await query<PaymentsSummaryRow>(
    `SELECT 
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
      COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) as total_refunded,
      COUNT(*) as payment_count
     FROM payments WHERE client_id = $1`,
    [clientId]
  );
  const row = result.rows[0];
  return {
    totalPaid: parseFloat(row.total_paid),
    totalPending: parseFloat(row.total_pending),
    totalRefunded: parseFloat(row.total_refunded),
    paymentCount: parseInt(row.payment_count, 10),
  };
}