import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getUserById,
  updateUser,
  deleteUser,
  listUsers,
  getRoles,
  changeUserRole,
  ASSIGNABLE_ROLES,
} from '../services/auth.service.js';
import {
  ValidationError,
  NotFoundError,
} from '@gym/shared/errors/index.js';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email?: string;
    role?: string;
  };
}

/** Fecha de nacimiento más antigua permitida al registrarse (formato AAAA-MM-DD). */
const MIN_BIRTH_DATE = '1950-01-01';

/** Nombres y apellidos: solo letras (con tildes y ñ) separadas por un espacio. */
const personNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u, 'Solo se permiten letras y espacios');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: personNameSchema,
  lastName: personNameSchema,
  phone: z.string().trim().regex(
  /^9\d{8}$/,
  'El teléfono debe tener exactamente 9 dígitos y comenzar con 9'
  ),
  birthDate: z
    .string()
    .date()
    .refine((value) => value >= MIN_BIRTH_DATE, 'La fecha de nacimiento debe ser desde el año 1950')
    .refine((value) => value <= new Date().toISOString().slice(0, 10), 'La fecha de nacimiento no puede ser futura')
    .optional(),
  gender: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const updateSelfSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  birthDate: z.string().date().optional(),
  gender: z.string().max(20).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  birthDate: z.string().date().optional(),
  gender: z.string().max(20).optional(),
  role: z.enum(['member', 'receptionist', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

/** `?ids=3,7,12` → [3, 7, 12]. Máximo 100 ids, enteros positivos. */
const idsFilterSchema = z.object({
  ids: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(',').map((id) => Number(id.trim())) : undefined))
    .pipe(z.array(z.number().int().positive()).max(100).optional()),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
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

export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, tokens } = await registerUser(req.body);
    res.status(201).json({ user, tokens });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, tokens } = await loginUser(req.body.email, req.body.password);
    res.json({ user, tokens });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await refreshAccessToken(req.body.refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).user?.sub;
    const refreshToken = req.body.refreshToken;
    await logoutUser(Number(userId), refreshToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).user?.sub;
    await changePassword(Number(userId), req.body.currentPassword, req.body.newPassword);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function requestPasswordResetController(req: Request, res: Response, next: NextFunction) {
  try {
    await requestPasswordReset(req.body.email);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    await resetPassword(req.body.token, req.body.newPassword);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).user?.sub;
    const user = await getUserById(Number(userId));
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateCurrentUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).user?.sub;
    const user = await updateUser(Number(userId), req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function getUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const user = await getUserById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const user = await updateUser(userId, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

const changeRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES),
});

export const changeRoleValidation = validate(changeRoleSchema);

/** PATCH /users/:id/role — solo admin. Cambia una cuenta entre socio y recepcionista. */
export async function changeUserRoleController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const targetUserId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (!Number.isSafeInteger(targetUserId) || targetUserId <= 0) {
      throw new ValidationError('ID de usuario inválido');
    }
    const actorId = Number(req.user?.sub);
    const user = await changeUserRole(actorId, targetUserId, req.body.role);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function deleteUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    await deleteUser(userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listUsersController(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const idsFilter = idsFilterSchema.safeParse(req.query);
    if (!idsFilter.success) {
      throw new ValidationError('El parámetro ids debe ser una lista de hasta 100 números separados por comas');
    }
    const { users, total } = await listUsers(page, limit, idsFilter.data.ids);
    res.json({
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRolesController(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await getRoles();
    res.json(roles);
  } catch (error) {
    next(error);
  }
}

export const registerValidation = validate(registerSchema);
export const loginValidation = validate(loginSchema);
export const refreshValidation = validate(refreshSchema);
export const changePasswordValidation = validate(changePasswordSchema);
export const resetPasswordRequestValidation = validate(resetPasswordRequestSchema);
export const resetPasswordValidation = validate(resetPasswordSchema);
export const updateSelfValidation = validate(updateSelfSchema);
export const updateUserValidation = validate(updateUserSchema);
