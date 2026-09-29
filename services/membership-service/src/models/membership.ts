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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlanData {
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  currency?: string;
  features?: string[];
  maxVisitsPerWeek?: number;
  includesPersonalTrainer?: boolean;
  includesClasses?: boolean;
  includesSauna?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  durationDays?: number;
  price?: number;
  currency?: string;
  features?: string[];
  maxVisitsPerWeek?: number;
  includesPersonalTrainer?: boolean;
  includesClasses?: boolean;
  includesSauna?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ClientMembership {
  id: number;
  clientId: number;
  planId: number;
  plan?: MembershipPlan;
  startDate: Date;
  endDate: Date;
  status: string;
  autoRenew: boolean;
  paymentMethodId?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMembershipData {
  clientId: number;
  planId: number;
  startDate?: string;
  autoRenew?: boolean;
  paymentMethodId?: string;
}

export interface UpdateMembershipData {
  planId?: number;
  autoRenew?: boolean;
  paymentMethodId?: string;
  status?: string;
  cancellationReason?: string;
}

export interface MembershipVisit {
  id: number;
  clientMembershipId: number;
  clientId: number;
  visitedAt: Date;
  checkOutAt?: Date;
  durationMinutes?: number;
  visitType: string;
  notes?: string;
}

export interface CreateVisitData {
  clientMembershipId: number;
  clientId: number;
  visitType?: string;
  notes?: string;
}

export interface MembershipFreeze {
  id: number;
  clientMembershipId: number;
  startDate: Date;
  endDate: Date;
  reason?: string;
  createdAt: Date;
}

export interface CreateFreezeData {
  clientMembershipId: number;
  startDate: string;
  endDate: string;
  reason?: string;
}