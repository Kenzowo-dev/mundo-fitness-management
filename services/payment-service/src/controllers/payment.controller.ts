import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createPayment,
  getPaymentById,
  getPaymentByTransactionId,
  updatePayment,
  listPayments,
  createInvoice,
  getInvoiceById,
  getInvoiceByNumber,
  listInvoices,
  markInvoicePaid,
  cancelInvoice,
  createPaymentMethod,
  getClientPaymentMethods,
  setDefaultPaymentMethod,
  deactivatePaymentMethod,
  createRefund,
  processRefund,
  getClientPaymentsSummary,
} from '../services/payment.service.js';
import {
  ValidationError,
  NotFoundError,
} from '@gym/shared/errors/index.js';

const createPaymentSchema = z.object({
  clientId: z.number().int().positive(),
  membershipId: z.number().int().positive().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  paymentMethod: z.string().min(1).max(50),
  transactionId: z.string().max(100).optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updatePaymentSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed', 'refunded', 'cancelled']).optional(),
  gatewayResponse: z.record(z.unknown()).optional(),
  failureReason: z.string().optional(),
});

const createInvoiceSchema = z.object({
  clientId: z.number().int().positive(),
  membershipId: z.number().int().positive().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  dueDate: z.string().date(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    total: z.number().positive(),
  })).min(1),
  notes: z.string().optional(),
});

const paymentMethodSchema = z.object({
  clientId: z.number().int().positive(),
  type: z.enum(['credit_card', 'debit_card', 'bank_transfer', 'cash', 'digital_wallet']),
  provider: z.string().max(50).optional(),
  providerToken: z.string().max(255).optional(),
  lastFour: z.string().length(4).optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).max(2040).optional(),
  isDefault: z.boolean().default(false),
});

const refundSchema = z.object({
  paymentId: z.number().int().positive(),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  clientId: z.coerce.number().int().positive().optional(),
  membershipId: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
});

function validate(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
        .join('; ');
      throw new ValidationError(message);
    }
    req.body = result.data;
    next();
  };
}

export async function createPaymentController(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await createPayment(req.body);
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
}

export async function getPaymentController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const payment = await getPaymentById(id);
    if (!payment) throw new NotFoundError('Payment', id);
    res.json(payment);
  } catch (error) {
    next(error);
  }
}

export async function getPaymentByTransactionIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const transactionId = Array.isArray(req.params.transactionId) ? req.params.transactionId[0] : req.params.transactionId;
    const payment = await getPaymentByTransactionId(transactionId);
    if (!payment) throw new NotFoundError('Payment', transactionId);
    res.json(payment);
  } catch (error) {
    next(error);
  }
}

export async function updatePaymentController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const payment = await updatePayment(id, req.body);
    res.json(payment);
  } catch (error) {
    next(error);
  }
}

export async function listPaymentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, clientId, membershipId, status } = paginationSchema.parse(req.query);
    const { payments, total } = await listPayments(page, limit, { clientId, membershipId, status });
    res.json({
      data: payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function createInvoiceController(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const invoice = await getInvoiceById(id);
    if (!invoice) throw new NotFoundError('Invoice', id);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceByNumberController(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceNumber = Array.isArray(req.params.invoiceNumber) ? req.params.invoiceNumber[0] : req.params.invoiceNumber;
    const invoice = await getInvoiceByNumber(invoiceNumber);
    if (!invoice) throw new NotFoundError('Invoice', invoiceNumber);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function listInvoicesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, clientId, status } = paginationSchema.parse(req.query);
    const { invoices, total } = await listInvoices(page, limit, { clientId, status });
    res.json({
      data: invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function markInvoicePaidController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const invoice = await markInvoicePaid(id);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function cancelInvoiceController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const invoice = await cancelInvoice(id);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

export async function createPaymentMethodController(req: Request, res: Response, next: NextFunction) {
  try {
    const method = await createPaymentMethod(req.body);
    res.status(201).json(method);
  } catch (error) {
    next(error);
  }
}

export async function getClientPaymentMethodsController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const methods = await getClientPaymentMethods(clientId);
    res.json(methods);
  } catch (error) {
    next(error);
  }
}

export async function setDefaultPaymentMethodController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const methodId = parseInt(Array.isArray(req.params.methodId) ? req.params.methodId[0] : req.params.methodId, 10);
    await setDefaultPaymentMethod(clientId, methodId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function deactivatePaymentMethodController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const methodId = parseInt(Array.isArray(req.params.methodId) ? req.params.methodId[0] : req.params.methodId, 10);
    await deactivatePaymentMethod(clientId, methodId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createRefundController(req: Request, res: Response, next: NextFunction) {
  try {
    const refund = await createRefund(req.body);
    res.status(201).json(refund);
  } catch (error) {
    next(error);
  }
}

export async function processRefundController(req: Request, res: Response, next: NextFunction) {
  try {
    const refundId = parseInt(Array.isArray(req.params.refundId) ? req.params.refundId[0] : req.params.refundId, 10);
    const refund = await processRefund(refundId);
    res.json(refund);
  } catch (error) {
    next(error);
  }
}

export async function getClientPaymentsSummaryController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const summary = await getClientPaymentsSummary(clientId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export const createPaymentValidation = validate(createPaymentSchema);
export const updatePaymentValidation = validate(updatePaymentSchema);
export const createInvoiceValidation = validate(createInvoiceSchema);
export const paymentMethodValidation = validate(paymentMethodSchema);
export const refundValidation = validate(refundSchema);