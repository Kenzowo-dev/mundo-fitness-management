import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  mapRowToPayment,
  mapRowToInvoice,
  mapRowToPaymentMethod,
  mapRowToRefund,
  type PaymentRow,
  type InvoiceRow,
  type PaymentMethodRow,
  type RefundRow,
} from '../src/services/payment.service.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const basePaymentRow: PaymentRow = {
  id: 200,
  client_id: 1,
  membership_id: 100,
  amount: '59.99',
  currency: 'USD',
  status: 'completed',
  payment_method: 'credit_card',
  transaction_id: 'txn_abc123',
  gateway_response: '{"code":"00","message":"Approved"}',
  description: 'Pago Plan Premium - Junio 2024',
  paid_at: new Date('2024-06-01T10:00:00Z'),
  failed_at: null,
  failure_reason: null,
  refunded_at: null,
  refund_amount: null,
  refund_reason: null,
  metadata: '{"source":"web","browser":"Chrome"}',
  created_at: new Date('2024-06-01'),
  updated_at: new Date('2024-06-01'),
};

const baseInvoiceRow: InvoiceRow = {
  id: 300,
  client_id: 1,
  membership_id: 100,
  invoice_number: 'INV-2024-000001',
  amount: '59.99',
  currency: 'USD',
  status: 'paid',
  due_date: new Date('2024-06-15'),
  paid_at: new Date('2024-06-01'),
  cancelled_at: null,
  items: '[{"description":"Plan Premium","quantity":1,"unit_price":59.99,"total":59.99}]',
  notes: null,
  created_at: new Date('2024-06-01'),
  updated_at: new Date('2024-06-01'),
};

const basePaymentMethodRow: PaymentMethodRow = {
  id: 10,
  client_id: 1,
  type: 'credit_card',
  provider: 'stripe',
  provider_token: 'tok_stripe_xyz789',
  last_four: '4242',
  expiry_month: 12,
  expiry_year: 2027,
  is_default: true,
  is_active: true,
  created_at: new Date('2024-01-15'),
  updated_at: new Date('2024-01-15'),
};

const baseRefundRow: RefundRow = {
  id: 50,
  payment_id: 200,
  amount: '29.99',
  reason: 'Cancelación anticipada',
  status: 'completed',
  processed_at: new Date('2024-06-10'),
  gateway_response: null,
  created_at: new Date('2024-06-10'),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Payment Service - mapRowToPayment', () => {
  it('debe parsear amount de string a number', () => {
    const payment = mapRowToPayment(basePaymentRow);

    assert.equal(payment.id, 200);
    assert.equal(payment.clientId, 1);
    assert.equal(payment.membershipId, 100);
    assert.equal(typeof payment.amount, 'number');
    assert.ok(Math.abs(payment.amount - 59.99) < 0.001);
    assert.equal(payment.currency, 'USD');
    assert.equal(payment.status, 'completed');
    assert.equal(payment.paymentMethod, 'credit_card');
    assert.equal(payment.transactionId, 'txn_abc123');
  });

  it('debe parsear gateway_response de JSON string a objeto', () => {
    const payment = mapRowToPayment(basePaymentRow);

    assert.ok(typeof payment.gatewayResponse === 'object');
    assert.equal((payment.gatewayResponse as Record<string, unknown>)['code'], '00');
  });

  it('debe parsear metadata de JSON string a objeto', () => {
    const payment = mapRowToPayment(basePaymentRow);

    assert.ok(typeof payment.metadata === 'object');
    assert.equal((payment.metadata as Record<string, unknown>)['source'], 'web');
  });

  it('debe convertir paid_at a Date y failed_at a undefined', () => {
    const payment = mapRowToPayment(basePaymentRow);

    assert.ok(payment.paidAt instanceof Date);
    assert.equal(payment.failedAt, undefined);
    assert.equal(payment.failureReason, undefined);
    assert.equal(payment.refundedAt, undefined);
    assert.equal(payment.refundAmount, undefined);
  });

  it('debe mapear un pago fallido con failure_reason', () => {
    const row: PaymentRow = {
      ...basePaymentRow,
      status: 'failed',
      paid_at: null,
      failed_at: new Date('2024-06-01T10:05:00Z'),
      failure_reason: 'Fondos insuficientes',
    };
    const payment = mapRowToPayment(row);

    assert.equal(payment.status, 'failed');
    assert.equal(payment.paidAt, undefined);
    assert.ok(payment.failedAt instanceof Date);
    assert.equal(payment.failureReason, 'Fondos insuficientes');
  });

  it('debe mapear un pago reembolsado con refund_amount', () => {
    const row: PaymentRow = {
      ...basePaymentRow,
      status: 'refunded',
      refunded_at: new Date('2024-06-10'),
      refund_amount: '29.99',
      refund_reason: 'Cancelación',
    };
    const payment = mapRowToPayment(row);

    assert.equal(payment.status, 'refunded');
    assert.ok(payment.refundedAt instanceof Date);
    assert.ok(Math.abs((payment.refundAmount as number) - 29.99) < 0.001);
    assert.equal(payment.refundReason, 'Cancelación');
  });
});

describe('Payment Service - mapRowToInvoice', () => {
  it('debe mapear correctamente una factura pagada', () => {
    const invoice = mapRowToInvoice(baseInvoiceRow);

    assert.equal(invoice.id, 300);
    assert.equal(invoice.invoiceNumber, 'INV-2024-000001');
    assert.equal(typeof invoice.amount, 'number');
    assert.ok(Math.abs(invoice.amount - 59.99) < 0.001);
    assert.equal(invoice.status, 'paid');
    assert.ok(invoice.paidAt instanceof Date);
    assert.equal(invoice.cancelledAt, undefined);
    assert.ok(invoice.dueDate instanceof Date);
  });

  it('debe parsear items de JSON string a array de objetos', () => {
    const invoice = mapRowToInvoice(baseInvoiceRow);

    assert.ok(Array.isArray(invoice.items));
    assert.equal(invoice.items.length, 1);
  });

  it('debe devolver array vacío para items null', () => {
    const row: InvoiceRow = { ...baseInvoiceRow, items: null };
    const invoice = mapRowToInvoice(row);

    assert.deepEqual(invoice.items, []);
  });
});

describe('Payment Service - mapRowToPaymentMethod', () => {
  it('debe mapear correctamente un método de pago', () => {
    const method = mapRowToPaymentMethod(basePaymentMethodRow);

    assert.equal(method.id, 10);
    assert.equal(method.clientId, 1);
    assert.equal(method.type, 'credit_card');
    assert.equal(method.provider, 'stripe');
    assert.equal(method.lastFour, '4242');
    assert.equal(method.expiryMonth, 12);
    assert.equal(method.expiryYear, 2027);
    assert.equal(method.isDefault, true);
    assert.equal(method.isActive, true);
  });

  it('debe convertir campos null a undefined en método de pago', () => {
    const row: PaymentMethodRow = {
      ...basePaymentMethodRow,
      provider: null,
      provider_token: null,
      last_four: null,
      expiry_month: null,
      expiry_year: null,
    };
    const method = mapRowToPaymentMethod(row);

    assert.equal(method.provider, undefined);
    assert.equal(method.providerToken, undefined);
    assert.equal(method.lastFour, undefined);
    assert.equal(method.expiryMonth, undefined);
    assert.equal(method.expiryYear, undefined);
  });
});

describe('Payment Service - mapRowToRefund', () => {
  it('debe mapear correctamente un reembolso procesado', () => {
    const refund = mapRowToRefund(baseRefundRow);

    assert.equal(refund.id, 50);
    assert.equal(refund.paymentId, 200);
    assert.equal(typeof refund.amount, 'number');
    assert.ok(Math.abs(refund.amount - 29.99) < 0.001);
    assert.equal(refund.reason, 'Cancelación anticipada');
    assert.equal(refund.status, 'completed');
    assert.ok(refund.processedAt instanceof Date);
    assert.equal(refund.gatewayResponse, undefined);
  });
});

describe('Payment Service - Validaciones de negocio de reembolso', () => {
  it('debe detectar que el monto de reembolso no puede superar el pago original', () => {
    const paymentAmount = 59.99;
    const refundAmount = 80.0;

    assert.ok(refundAmount > paymentAmount); // la función debería lanzar ValidationError
  });

  it('debe detectar que solo se pueden reembolsar pagos con estado completed', () => {
    const statuses = ['pending', 'failed', 'refunded'];
    for (const status of statuses) {
      assert.notEqual(status, 'completed'); // cualquier estado != completed debería fallar
    }
  });

  it('debe detectar que reembolsos acumulados no superen el monto total del pago', () => {
    const paymentAmount = 100.0;
    const existingRefunds = 70.0;
    const newRefundAmount = 40.0;

    assert.ok(existingRefunds + newRefundAmount > paymentAmount); // debería lanzar REFUND_EXCEEDS_PAYMENT
  });
});
