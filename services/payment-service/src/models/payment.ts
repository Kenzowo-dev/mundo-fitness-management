export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface Payment {
  id: number;
  clientId: number;
  clientName?: string;
  membershipId?: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  description?: string;
  paidAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentData {
  clientId: number;
  membershipId: number;
  amount: number;
  currency?: string;
  paymentMethod: string;
  transactionId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePaymentData {
  status?: Exclude<PaymentStatus, 'refunded'>;
  gatewayResponse?: Record<string, unknown>;
  paidAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export interface Invoice {
  id: number;
  clientId: number;
  membershipId?: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  items: InvoiceItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateInvoiceData {
  clientId: number;
  membershipId?: number;
  amount: number;
  currency?: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
}

export interface PaymentMethod {
  id: number;
  clientId: number;
  type: string;
  provider?: string;
  providerToken?: string;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentMethodData {
  clientId: number;
  type: string;
  provider?: string;
  providerToken?: string;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}

export interface Refund {
  id: number;
  paymentId: number;
  amount: number;
  reason?: string;
  status: string;
  processedAt?: Date;
  gatewayResponse?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateRefundData {
  paymentId: number;
  amount: number;
  reason?: string;
}
