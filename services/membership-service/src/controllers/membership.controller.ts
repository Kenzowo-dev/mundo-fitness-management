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
  listMemberships,
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
  getMembershipDashboardStats,
  getMembershipReports,
  createMembershipRenewalRequest,
  listMyMembershipRenewalRequests,
  listMembershipRenewalRequests,
  updateMembershipRenewalRequest,
} from '../services/membership.service.js';
import {
  ValidationError,
  NotFoundError,
} from '@gym/shared/errors/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/** Nombre de plan: letras, números, espacios y + - . */
const planNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[\p{L}\p{M}\d][\p{L}\p{M}\d +.-]*$/u, 'El nombre solo puede tener letras, números, espacios y + - .');

const createPlanSchema = z.object({
  name: planNameSchema,
  description: z.string().trim().max(500).optional(),
  durationDays: z.number().int().min(1).max(3660),
  price: z.number().positive().max(99_999_999.99).multipleOf(0.01),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  features: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  maxVisitsPerWeek: z.number().int().min(1).max(21).optional(),
  includesPersonalTrainer: z.boolean().default(false),
  includesClasses: z.boolean().default(false),
  includesSauna: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(999999).default(0),
});

const updatePlanSchema = z.object({
  name: planNameSchema.optional(),
  description: z.string().trim().max(500).optional(),
  durationDays: z.number().int().min(1).max(3660).optional(),
  price: z.number().positive().max(99_999_999.99).multipleOf(0.01).optional(),
  currency: z.enum(['PEN', 'USD']).optional(),
  features: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  maxVisitsPerWeek: z.number().int().min(1).max(21).optional(),
  includesPersonalTrainer: z.boolean().optional(),
  includesClasses: z.boolean().optional(),
  includesSauna: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999999).optional(),
});

const createMembershipSchema = z.object({
  clientId: z.number().int().positive(),
  planId: z.number().int().positive(),
  startDate: z.string().date().optional(),
  autoRenew: z.boolean().default(true),
  paymentMethodId: z.string().max(100).optional(),
});

const createRenewalRequestSchema = z.object({
  planId: z.number().int().positive(),
  memberNote: z.string().trim().max(500).optional(),
});

const updateRenewalRequestSchema = z.object({
  status: z.enum(['contacted', 'closed']),
  staffNote: z.string().trim().max(500).optional(),
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
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
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

export async function getPlanController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const plan = await getPlanById(id);
    if (!plan || (!plan.isActive && req.user?.role !== 'admin')) throw new NotFoundError('MembershipPlan', id);
    res.json(plan);
  } catch (error) {
    next(error);
  }
}

export async function listPlansController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const activeOnly =
      req.query.activeOnly !== 'false' || req.user?.role !== 'admin';

    const hasPagination =
      req.query.page !== undefined && req.query.limit !== undefined;

    if (!hasPagination) {
      const result = await listPlans(activeOnly);
      return res.json(Array.isArray(result) ? result : result.data);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const result = await listPlans(activeOnly, page, limit);

    if (Array.isArray(result)) return res.json(result);

    return res.json({
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listPublicPlansController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await listPlans(true);

    const plans = Array.isArray(result) ? result : result.data;

    return res.json(
      plans.map(({
        id,
        name,
        description,
        durationDays,
        price,
        currency,
        features,
        maxVisitsPerWeek,
        includesClasses,
        includesSauna,
      }) => ({
        id,
        name,
        description,
        durationDays,
        price,
        currency,
        features,
        maxVisitsPerWeek,
        includesClasses,
        includesSauna,
      }))
    );
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

export async function listMembershipsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const hasPagination =
      req.query.page !== undefined && req.query.limit !== undefined;

    if (!hasPagination) {
      const result = await listMemberships();
      return res.json(Array.isArray(result) ? result : result.data);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const result = await listMemberships(page, limit);

    if (Array.isArray(result)) return res.json(result);

    return res.json({
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
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

export async function getMembershipDashboardStatsController(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getMembershipDashboardStats());
  } catch (error) {
    next(error);
  }
}

export async function getMembershipReportsController(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getMembershipReports());
  } catch (error) {
    next(error);
  }
}

export async function createRenewalRequestController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.user?.sub);
    const renewalRequest = await createMembershipRenewalRequest(userId, req.body.planId, req.body.memberNote);
    res.status(201).json(renewalRequest);
  } catch (error) {
    next(error);
  }
}

export async function listMyRenewalRequestsController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = Number(req.user?.sub);
    const requests = await listMyMembershipRenewalRequests(userId);
    res.json(requests);
  } catch (error) {
    next(error);
  }
}

export async function listRenewalRequestsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const hasPagination =
      req.query.page !== undefined && req.query.limit !== undefined;

    if (!hasPagination) {
      const result = await listMembershipRenewalRequests();
      return res.json(Array.isArray(result) ? result : result.requests);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const result = await listMembershipRenewalRequests(page, limit);

    if (Array.isArray(result)) return res.json(result);

    return res.json({
      data: result.requests,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRenewalRequestController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const requestId = Number(req.params.requestId);
    const userId = Number(req.user?.sub);
    const renewalRequest = await updateMembershipRenewalRequest(
      requestId,
      req.body.status,
      userId,
      req.body.staffNote,
    );
    res.json(renewalRequest);
  } catch (error) {
    next(error);
  }
}

export const createPlanValidation = validate(createPlanSchema);
export const updatePlanValidation = validate(updatePlanSchema);
export const createMembershipValidation = validate(createMembershipSchema);
export const createRenewalRequestValidation = validate(createRenewalRequestSchema);
export const updateRenewalRequestValidation = validate(updateRenewalRequestSchema);
export const updateMembershipValidation = validate(updateMembershipSchema);
export const visitValidation = validate(visitSchema);
export const freezeValidation = validate(freezeSchema);
