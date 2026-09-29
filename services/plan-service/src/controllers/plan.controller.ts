import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createExercise,
  getExerciseById,
  listExercises,
  updateExercise,
  createPlan,
  getPlanById,
  listPlans,
  updatePlan,
  deletePlan,
  assignPlanToClient,
  getClientPlans,
  getActiveClientPlan,
  updateClientPlanProgress,
  completeClientPlan,
  logWorkout,
  getWorkoutLogs,
  getWorkoutLogWithExercises,
} from '../services/plan.service.js';
import {
  ValidationError,
  NotFoundError,
} from '@gym/shared/errors/index.js';

const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  muscleGroup: z.string().min(1).max(50),
  secondaryMuscles: z.array(z.string()).optional(),
  equipment: z.string().max(100).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  instructions: z.string().optional(),
  videoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
});

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  goal: z.string().max(50).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  durationWeeks: z.number().int().positive().optional(),
  daysPerWeek: z.number().int().positive().max(7).optional(),
  isPublic: z.boolean().default(false),
  createdBy: z.number().int().positive().optional(),
  days: z.array(z.object({
    dayNumber: z.number().int().positive(),
    name: z.string().max(100).optional(),
    focus: z.string().max(100).optional(),
    notes: z.string().optional(),
    exercises: z.array(z.object({
      exerciseId: z.number().int().positive(),
      orderIndex: z.number().int().nonnegative().default(0),
      sets: z.number().int().positive().default(3),
      reps: z.string().default('8-12'),
      restSeconds: z.number().int().positive().default(90),
      weightPercentage: z.number().optional(),
      notes: z.string().optional(),
    })).min(1),
  })).min(1),
});

const assignPlanSchema = z.object({
  clientId: z.number().int().positive(),
  planId: z.number().int().positive(),
  assignedBy: z.number().int().positive().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

const logWorkoutSchema = z.object({
  clientPlanId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  planDayId: z.number().int().positive(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  exercises: z.array(z.object({
    planExerciseId: z.number().int().positive(),
    exerciseId: z.number().int().positive(),
    setsCompleted: z.number().int().nonnegative(),
    repsCompleted: z.array(z.number().int().positive()),
    weightsUsed: z.array(z.number().nonnegative()),
    rpe: z.number().min(1).max(10).optional(),
    notes: z.string().optional(),
  })).min(1),
});

const updateProgressSchema = z.object({
  currentWeek: z.number().int().positive(),
  currentDay: z.number().int().positive(),
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

export async function createExerciseController(req: Request, res: Response, next: NextFunction) {
  try {
    const exercise = await createExercise(req.body);
    res.status(201).json(exercise);
  } catch (error) {
    next(error);
  }
}

export async function getExerciseController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const exercise = await getExerciseById(id);
    if (!exercise) throw new NotFoundError('Exercise', id);
    res.json(exercise);
  } catch (error) {
    next(error);
  }
}

export async function listExercisesController(req: Request, res: Response, next: NextFunction) {
  try {
    const muscleGroup = req.query.muscleGroup as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const exercises = await listExercises(muscleGroup, difficulty);
    res.json(exercises);
  } catch (error) {
    next(error);
  }
}

export async function updateExerciseController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const exercise = await updateExercise(id, req.body);
    res.json(exercise);
  } catch (error) {
    next(error);
  }
}

export async function createPlanController(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await createPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
}

export async function getPlanController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const includeDays = req.query.includeDays === 'true';
    const plan = await getPlanById(id, includeDays);
    if (!plan) throw new NotFoundError('WorkoutPlan', id);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

export async function listPlansController(req: Request, res: Response, next: NextFunction) {
  try {
    const publicOnly = req.query.publicOnly === 'true';
    const createdBy = req.query.createdBy ? parseInt(req.query.createdBy as string, 10) : undefined;
    const plans = await listPlans(publicOnly, createdBy);
    res.json(plans);
  } catch (error) {
    next(error);
  }
}

export async function updatePlanController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const plan = await updatePlan(id, req.body);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

export async function deletePlanController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    await deletePlan(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function assignPlanController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientPlan = await assignPlanToClient(req.body);
    res.status(201).json(clientPlan);
  } catch (error) {
    next(error);
  }
}

export async function getClientPlansController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const plans = await getClientPlans(clientId);
    res.json(plans);
  } catch (error) {
    next(error);
  }
}

export async function getActivePlanController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const plan = await getActiveClientPlan(clientId);
    if (!plan) throw new NotFoundError('Active plan', clientId);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

export async function updateProgressController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientPlanId = parseInt(Array.isArray(req.params.clientPlanId) ? req.params.clientPlanId[0] : req.params.clientPlanId, 10);
    const plan = await updateClientPlanProgress(clientPlanId, req.body.currentWeek, req.body.currentDay);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

export async function completePlanController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientPlanId = parseInt(Array.isArray(req.params.clientPlanId) ? req.params.clientPlanId[0] : req.params.clientPlanId, 10);
    const plan = await completeClientPlan(clientPlanId);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

export async function logWorkoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const log = await logWorkout(req.body);
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
}

export async function getWorkoutLogsController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientPlanId = parseInt(Array.isArray(req.params.clientPlanId) ? req.params.clientPlanId[0] : req.params.clientPlanId, 10);
    const logs = await getWorkoutLogs(clientPlanId);
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

export async function getWorkoutLogController(req: Request, res: Response, next: NextFunction) {
  try {
    const logId = parseInt(Array.isArray(req.params.logId) ? req.params.logId[0] : req.params.logId, 10);
    const log = await getWorkoutLogWithExercises(logId);
    if (!log) throw new NotFoundError('WorkoutLog', logId);
    res.json(log);
  } catch (error) {
    next(error);
  }
}

export const createExerciseValidation = validate(createExerciseSchema);
export const createPlanValidation = validate(createPlanSchema);
export const assignPlanValidation = validate(assignPlanSchema);
export const logWorkoutValidation = validate(logWorkoutSchema);
export const updateProgressValidation = validate(updateProgressSchema);