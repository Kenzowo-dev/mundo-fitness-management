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

export interface WorkoutPlan {
  id: number;
  name: string;
  description?: string;
  goal?: string;
  difficulty: string;
  durationWeeks?: number;
  daysPerWeek?: number;
  isPublic: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  days?: PlanDay[];
}

export interface PlanDay {
  id: number;
  planId: number;
  dayNumber: number;
  name?: string;
  focus?: string;
  notes?: string;
  exercises?: PlanExercise[];
}

export interface PlanExercise {
  id: number;
  planDayId: number;
  exerciseId: number;
  exercise?: Exercise;
  orderIndex: number;
  sets: number;
  reps: string;
  restSeconds: number;
  weightPercentage?: number;
  notes?: string;
}

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment?: string;
  difficulty: string;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface ClientPlan {
  id: number;
  clientId: number;
  planId: number;
  plan?: WorkoutPlan;
  assignedBy?: number;
  startDate: string;
  endDate?: string;
  status: string;
  currentWeek: number;
  currentDay: number;
  notes?: string;
}

export interface WorkoutLog {
  id: number;
  clientPlanId: number;
  clientId: number;
  planDayId: number;
  completedAt: string;
  durationMinutes?: number;
  notes?: string;
  rating?: number;
  exercises?: LoggedExercise[];
}

export interface LoggedExercise {
  id: number;
  workoutLogId: number;
  planExerciseId: number;
  exerciseId: number;
  exercise?: Exercise;
  setsCompleted: number;
  repsCompleted: number[];
  weightsUsed: number[];
  rpe?: number;
  notes?: string;
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

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface DashboardWidget {
  id: number;
  name: string;
  type: 'metric' | 'line' | 'pie' | 'bar' | 'heatmap' | 'table';
  width: number;
  height: number;
  query: string;
  parameters?: Record<string, unknown>;
}

export interface WidgetData {
  columns: string[];
  rows: unknown[][];
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

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment?: string;
  difficulty: string;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  isActive: boolean;
}