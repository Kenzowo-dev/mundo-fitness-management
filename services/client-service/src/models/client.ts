export interface Client {
  id: number;
  userId?: number;
  dni: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  gender?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  notes?: string;
  status: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
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

export interface UpdateClientData {
  dni?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  notes?: string;
  status?: string;
}

export interface ClientMeasurement {
  id: number;
  clientId: number;
  weightKg?: number;
  heightCm?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepCm?: number;
  thighCm?: number;
  measuredAt: Date;
  notes?: string;
}

export interface CreateMeasurementData {
  clientId: number;
  weightKg?: number;
  heightCm?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepCm?: number;
  thighCm?: number;
  notes?: string;
}

export interface ClientGoal {
  id: number;
  clientId: number;
  goalType: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: Date;
  achievedAt?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalData {
  clientId: number;
  goalType: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: string;
}

export interface UpdateGoalData {
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: string;
  status?: string;
}

export interface ClientDocument {
  id: number;
  clientId: number;
  documentType: string;
  fileName: string;
  filePath: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy?: number;
  createdAt: Date;
}