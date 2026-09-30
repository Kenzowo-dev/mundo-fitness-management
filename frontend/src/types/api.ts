export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Client {
  id: number;
  userId?: number;
  dni: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  notes?: string;
  status: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
}

export interface CreateClientData {
  userId?: number;
  dni: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  notes?: string;
}

export interface MembershipPlan {
  id: number;
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  currency: string;
  features: string[];
  maxVisitsPerWeek?: number;
  includesPersonalTrainer: boolean;
  includesClasses: boolean;
  includesSauna: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipPlanInput {
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  currency: 'PEN' | 'USD';
  features: string[];
  maxVisitsPerWeek?: number;
  includesClasses: boolean;
  includesSauna: boolean;
  sortOrder: number;
}

export type UpdateMembershipPlanInput = Partial<CreateMembershipPlanInput> & { isActive?: boolean };

export type MembershipRenewalRequestStatus = 'pending' | 'contacted' | 'closed';

export interface MembershipRenewalRequest {
  id: number;
  clientId: number;
  planId: number;
  planName: string;
  status: MembershipRenewalRequestStatus;
  memberNote?: string;
  staffNote?: string;
  requestedAt: string;
  updatedAt: string;
  handledBy?: number;
  clientName?: string;
  clientEmail?: string;
  clientDni?: string;
}

export interface ClientMembership {
  id: number;
  clientId: number;
  planId: number;
  plan?: MembershipPlan;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
  paymentMethodId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  clientId: number;
  clientName?: string;
  membershipId?: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CreatePaymentInput {
  clientId: number;
  membershipId: number;
  amount: number;
  currency: 'PEN' | 'USD';
  paymentMethod: 'cash' | 'bank_transfer' | 'digital_wallet' | 'credit_card' | 'debit_card';
  transactionId?: string;
  description?: string;
}

export interface Invoice {
  id: number;
  clientId: number;
  membershipId?: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  items: InvoiceItem[];
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientDashboardStats {
  totalClients: number;
  activeClients: number;
}

export interface MembershipDashboardStats {
  activeMemberships: number;
  visitsToday: number;
}

export interface PaymentDashboardStats {
  revenueThisMonth: Array<{ currency: string; amount: number }>;
}

export interface ClientReports {
  clientsByMonth: Array<{ month: string; count: number }>;
  clientsByStatus: Array<{ status: string; count: number }>;
}

export interface MembershipReports {
  membershipsByStatus: Array<{ status: string; count: number }>;
  visitsByDay: Array<{ date: string; count: number }>;
}

export type PaymentReports = Array<{ month: string; currency: string; amount: number }>;

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface MembershipVisit {
  id: number;
  clientMembershipId: number;
  clientId: number;
  visitedAt: string;
  checkOutAt?: string;
  durationMinutes?: number;
  visitType: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  currency: string;
}
