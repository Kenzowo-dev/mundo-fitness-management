import type { Response, NextFunction } from "express";
import { z } from "zod";

import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "@gym/shared/errors/index.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { getClientByUserId } from "../services/client.service.js";

import {
  getFitnessProfile,
  saveFitnessProfile,
  createFitnessPlan,
  requireActiveFitnessMembership,
  getFitnessPlans,
  getFitnessPlanById,
  completeFitnessWorkout,
  getFitnessWorkoutHistory,
} from "../services/fitness.service.js";

const fitnessProfileSchema = z.strictObject({
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
  trainingLocation: z.enum(["home", "gym", "both"]),
  equipment: z.array(z.string().trim().min(1).max(50)).max(30),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(15).max(120),
  preferredGoal: z.enum([
    "weight",
    "muscle",
    "body_fat",
    "endurance",
    "strength",
    "general",
  ]),
  mobilityNotes: z.string().trim().max(1000).nullable().optional(),

  preferredExerciseTypes: z.array(
    z.enum(["strength", "cardio", "mobility"])
  ).max(3).optional(),

  avoidedExerciseIds: z.array(
    z.string().trim().min(1).max(100)
  ).max(100).optional(),

  preferredIntensity: z.enum([
    "light",
    "moderate",
    "intense",
  ]).optional(),

  dietaryPreferences: z.array(
    z.string().trim().min(1).max(100)
  ).max(20).optional(),

  dislikedIngredients: z.array(
    z.string().trim().min(1).max(100)
  ).max(100).optional(),

  foodAllergies: z.array(
    z.string().trim().min(1).max(100)
  ).max(100).optional(),
});

const workoutLogSchema = z.strictObject({
  durationMinutes: z.number().int().min(1).max(300).optional(),
  perceivedEffort: z.number().int().min(1).max(10).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const positiveIdSchema = z.coerce.number().int().positive().safe();

function validateBody<T extends z.ZodType>(
  schema: T,
  body: unknown,
): z.output<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new ValidationError(
      result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    );
  }

  return result.data;
}

function parseId(value: unknown): number {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new ValidationError("Identificador inválido");
  }

  return validateBody(positiveIdSchema, value);
}

async function getAuthenticatedClientId(
  req: AuthenticatedRequest,
): Promise<number> {
  const userId = Number(req.user?.sub);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new AuthenticationError("Usuario no autenticado");
  }

  const client = await getClientByUserId(userId);

  if (!client) {
    throw new NotFoundError("Client", userId);
  }

  return client.id;
}

/**
 * Consulta las preferencias de entrenamiento del socio autenticado.
 *
 * Obtiene su identificador desde el token JWT y recupera
 * el perfil fitness almacenado en PostgreSQL.
 */
export async function getFitnessProfileController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const clientId = await getAuthenticatedClientId(req);
    const profile = await getFitnessProfile(clientId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

/**
 * Guarda o actualiza las preferencias fitness del socio.
 *
 * Valida el nivel de experiencia, lugar de entrenamiento,
 * equipamiento disponible, frecuencia semanal y objetivo.
 */
export async function saveFitnessProfileController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = validateBody(fitnessProfileSchema, req.body);
    const clientId = await getAuthenticatedClientId(req);
    const profile = await saveFitnessProfile(clientId, data);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

/**
 * Genera un plan de entrenamiento personalizado.
 *
 * Utiliza las preferencias del socio para construir
 * una rutina semanal y guardarla en la base de datos.
 */
export async function createFitnessPlanController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const clientId = await getAuthenticatedClientId(req);
    await requireActiveFitnessMembership(clientId);
    const plan = await createFitnessPlan(clientId);
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
}

/**
 * Obtiene los planes de entrenamiento del socio.
 *
 * Devuelve únicamente los planes asociados a su cuenta.
 */
export async function getFitnessPlansController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const clientId = await getAuthenticatedClientId(req);
    const plans = await getFitnessPlans(clientId);
    res.json(plans);
  } catch (error) {
    next(error);
  }
}

/**
 * Consulta un plan específico y sus sesiones.
 *
 * Valida el identificador y comprueba que el plan
 * pertenezca al socio autenticado.
 */
export async function getFitnessPlanByIdController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const planId = parseId(req.params.id);
    const clientId = await getAuthenticatedClientId(req);
    const plan = await getFitnessPlanById(clientId, planId);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

/**
 * Registra un entrenamiento realizado por el socio.
 *
 * Valida la sesión, duración, esfuerzo percibido
 * y observaciones antes de guardar el registro.
 */
export async function completeFitnessWorkoutController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const sessionId = parseId(req.params.id);
    const data = validateBody(workoutLogSchema, req.body);
    const clientId = await getAuthenticatedClientId(req);
    await requireActiveFitnessMembership(clientId);

    const log = await completeFitnessWorkout(
      clientId,
      sessionId,
      data,
    );

    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
}

/**
 * Recupera el historial de entrenamientos completados.
 *
 * Permite consultar las sesiones registradas
 * para realizar un seguimiento del progreso.
 */
export async function getFitnessWorkoutHistoryController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const clientId = await getAuthenticatedClientId(req);
    const history = await getFitnessWorkoutHistory(clientId);
    res.json(history);
  } catch (error) {
    next(error);
  }
}
