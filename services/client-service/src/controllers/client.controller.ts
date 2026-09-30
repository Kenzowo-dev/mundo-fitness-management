import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createClient,
  getClientById,
  getClientByDni,
  getClientByUserId,
  updateClient,
  deleteClient,
  listClients,
  getClientStats,
  getClientReports,
  addMeasurement,
  getClientMeasurements,
  getLatestMeasurement,
  createGoal,
  getClientGoals,
  updateGoal,
  deleteGoal,
  addDocument,
  getClientDocuments,
  deleteDocument,
} from '../services/client.service.js';
import {
  ValidationError,
  NotFoundError,
} from '@gym/shared/errors/index.js';

const createClientSchema = z.object({
  userId: z.number().int().positive().optional(),
  dni: z.string().length(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  birthDate: z.string().date().optional(),
  gender: z.string().max(20).optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  medicalConditions: z.string().optional(),
  notes: z.string().optional(),
});

const updateClientSchema = z.object({
  dni: z.string().length(8).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  birthDate: z.string().date().optional(),
  gender: z.string().max(20).optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  medicalConditions: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

const updateOwnClientSchema = z.object({
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), {
  message: 'Proporciona al menos un dato de contacto para actualizar.',
});

const measurementSchema = z.object({
  clientId: z.number().int().positive(),
  weightKg: z.number().positive().max(500).optional(),
  heightCm: z.number().positive().max(300).optional(),
  bodyFatPercentage: z.number().min(0).max(100).optional(),
  muscleMassKg: z.number().positive().max(200).optional(),
  chestCm: z.number().positive().max(200).optional(),
  waistCm: z.number().positive().max(200).optional(),
  hipsCm: z.number().positive().max(200).optional(),
  bicepCm: z.number().positive().max(100).optional(),
  thighCm: z.number().positive().max(100).optional(),
  notes: z.string().optional(),
});

const goalSchema = z.object({
  clientId: z.number().int().positive(),
  goalType: z.string().min(1).max(50),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().max(20).optional(),
  targetDate: z.string().date().optional(),
});

const updateGoalSchema = z.object({
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().max(20).optional(),
  targetDate: z.string().date().optional(),
  status: z.enum(['in_progress', 'achieved', 'cancelled']).optional(),
});

const documentSchema = z.object({
  clientId: z.number().int().positive(),
  documentType: z.string().min(1).max(50),
  fileName: z.string().min(1).max(255),
  filePath: z.string().min(1).max(500),
  mimeType: z.string().max(100).optional(),
  fileSize: z.number().int().positive().optional(),
  uploadedBy: z.number().int().positive().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  search: z.string().optional(),
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

export async function createClientController(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
}

export async function getClientController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const client = await getClientById(id);
    if (!client) throw new NotFoundError('Client', id);
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function getClientByDniController(req: Request, res: Response, next: NextFunction) {
  try {
    const dni = Array.isArray(req.params.dni) ? req.params.dni[0] : req.params.dni;
    const client = await getClientByDni(dni);
    if (!client) throw new NotFoundError('Client', dni);
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function getClientByUserIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
    const client = await getClientByUserId(userId);
    if (!client) throw new NotFoundError('Client', userId);
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function updateClientController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const client = await updateClient(id, req.body);
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function updateOwnClientController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
    const existing = await getClientByUserId(userId);
    if (!existing) throw new NotFoundError('Client', userId);
    const client = await updateClient(existing.id, req.body);
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function deleteClientController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    await deleteClient(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listClientsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, status, search } = paginationSchema.parse(req.query);
    const { clients, total } = await listClients(page, limit, { status, search });
    res.json({
      data: clients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getClientStatsController(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getClientStats());
  } catch (error) {
    next(error);
  }
}

export async function getClientReportsController(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getClientReports());
  } catch (error) {
    next(error);
  }
}

export async function addMeasurementController(req: Request, res: Response, next: NextFunction) {
  try {
    const measurement = await addMeasurement(req.body);
    res.status(201).json(measurement);
  } catch (error) {
    next(error);
  }
}

export async function getClientMeasurementsController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const measurements = await getClientMeasurements(clientId, limit);
    res.json(measurements);
  } catch (error) {
    next(error);
  }
}

export async function getLatestMeasurementController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const measurement = await getLatestMeasurement(clientId);
    if (!measurement) throw new NotFoundError('Measurement', clientId);
    res.json(measurement);
  } catch (error) {
    next(error);
  }
}

export async function createGoalController(req: Request, res: Response, next: NextFunction) {
  try {
    const goal = await createGoal(req.body);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
}

export async function getClientGoalsController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const goals = await getClientGoals(clientId);
    res.json(goals);
  } catch (error) {
    next(error);
  }
}

export async function updateGoalController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const goal = await updateGoal(id, req.body);
    res.json(goal);
  } catch (error) {
    next(error);
  }
}

export async function deleteGoalController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    await deleteGoal(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function addDocumentController(req: Request, res: Response, next: NextFunction) {
  try {
    const document = await addDocument(
      req.body.clientId,
      req.body.documentType,
      req.body.fileName,
      req.body.filePath,
      req.body.mimeType,
      req.body.fileSize,
      req.body.uploadedBy
    );
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

export async function getClientDocumentsController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const documents = await getClientDocuments(clientId);
    res.json(documents);
  } catch (error) {
    next(error);
  }
}

export async function deleteDocumentController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    await deleteDocument(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const createClientValidation = validate(createClientSchema);
export const updateClientValidation = validate(updateClientSchema);
export const updateOwnClientValidation = validate(updateOwnClientSchema);
export const measurementValidation = validate(measurementSchema);
export const goalValidation = validate(goalSchema);
export const updateGoalValidation = validate(updateGoalSchema);
export const documentValidation = validate(documentSchema);
