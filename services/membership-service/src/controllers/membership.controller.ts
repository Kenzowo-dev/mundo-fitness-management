import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createPlan,
  getPlanById,
  listPlans,
  updatePlan,
  deletePlan,
  createMembership,
  getMembershipById,
  getClientMemberships,
  updateMembership,
  cancelMembership,
  renewMembership,
  checkIn,
  checkOut,
  getClientVisits,
  createFreeze,
  getMembershipFreezes,
  getExpiringMemberships,
} from '../services/membership.service.js';
import {
  ValidationError,
  NotFoundError,
} from '@gym/shared/errors/index.js';

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  durationDays: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  features: z.array(z.string()).optional(),
  maxVisitsPerWeek: z.number().int().positive().optional(),
  includesPersonalTrainer: z.boolean().default(false),
  includesClasses: z.boolean().default(false),
  includesSauna: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  durationDays: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  features: z.array(z.string()).optional(),
  maxVisitsPerWeek: z.number().int().positive().optional(),
  includesPersonalTrainer: z.boolean().optional(),
  includesClasses: z.boolean().optional(),
  includesSauna: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const createMembershipSchema = z.object({
  clientId: z.number().int().positive(),
  planId: z.number().int().positive(),
  startDate: z.string().date().optional(),
  autoRenew: z.boolean().default(true),
  paymentMethodId: z.string().max(100).optional(),
});

const updateMembershipSchema = z.object({
  planId: z.number().int().positive().optional(),
  autoRenew: z.boolean().optional(),
  paymentMethodId: z.string().max(100).optional(),
  status: z.enum(['active', 'cancelled', 'expired', 'frozen']).optional(),
  cancellationReason: z.string().optional(),
});

const visitSchema = z.object({
  clientMembershipId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  visitType: z.enum(['gym', 'class', 'personal_training', 'sauna']).default('gym'),
  notes: z.string().optional(),
});

const freezeSchema = z.object({
  clientMembershipId: z.number().int().positive(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().optional(),
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
    const plan = await getPlanById(id);
    if (!plan) throw new NotFoundError('MembershipPlan', id);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

export async function listPlansController(req: Request, res: Response, next: NextFunction) {
  try {
    const activeOnly = req.query.active !== 'false';
    const plans = await listPlans(activeOnly);
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

export async function createMembershipController(req: Request, res: Response, next: NextFunction) {
  try {
    const membership = await createMembership(req.body);
    res.status(201).json(membership);
  } catch (error) {
    next(error);
  }
}

export async function getMembershipController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const membership = await getMembershipById(id);
    if (!membership) throw new NotFoundError('ClientMembership', id);
    res.json(membership);
  } catch (error) {
    next(error);
  }
}

export async function getClientMembershipsController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const memberships = await getClientMemberships(clientId);
    res.json(memberships);
  } catch (error) {
    next(error);
  }
}

export async function updateMembershipController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const membership = await updateMembership(id, req.body);
    res.json(membership);
  } catch (error) {
    next(error);
  }
}

export async function cancelMembershipController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const membership = await cancelMembership(id, req.body.cancellationReason);
    res.json(membership);
  } catch (error) {
    next(error);
  }
}

export async function renewMembershipController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const membership = await renewMembership(id);
    res.json(membership);
  } catch (error) {
    next(error);
  }
}

export async function checkInController(req: Request, res: Response, next: NextFunction) {
  try {
    const visit = await checkIn(req.body);
    res.status(201).json(visit);
  } catch (error) {
    next(error);
  }
}

export async function checkOutController(req: Request, res: Response, next: NextFunction) {
  try {
    const visitId = parseInt(Array.isArray(req.params.visitId) ? req.params.visitId[0] : req.params.visitId, 10);
    const visit = await checkOut(visitId);
    res.json(visit);
  } catch (error) {
    next(error);
  }
}

export async function getClientVisitsController(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = parseInt(Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId, 10);
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const visits = await getClientVisits(clientId, limit);
    res.json(visits);
  } catch (error) {
    next(error);
  }
}

export async function createFreezeController(req: Request, res: Response, next: NextFunction) {
  try {
    const freeze = await createFreeze(req.body);
    res.status(201).json(freeze);
  } catch (error) {
    next(error);
  }
}

export async function getMembershipFreezesController(req: Request, res: Response, next: NextFunction) {
  try {
    const membershipId = parseInt(Array.isArray(req.params.membershipId) ? req.params.membershipId[0] : req.params.membershipId, 10);
    const freezes = await getMembershipFreezes(membershipId);
    res.json(freezes);
  } catch (error) {
    next(error);
  }
}

export async function getExpiringMembershipsController(req: Request, res: Response, next: NextFunction) {
  try {
    const days = parseInt(req.query.days as string, 10) || 7;
    const memberships = await getExpiringMemberships(days);
    res.json(memberships);
  } catch (error) {
    next(error);
  }
}

export const createPlanValidation = validate(createPlanSchema);
export const updatePlanValidation = validate(updatePlanSchema);
export const createMembershipValidation = validate(createMembershipSchema);
export const updateMembershipValidation = validate(updateMembershipSchema);
export const visitValidation = validate(visitSchema);
export const freezeValidation = validate(freezeSchema);