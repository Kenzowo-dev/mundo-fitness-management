import { z } from 'zod';

/**
 * Factory que crea una función validadora a partir de un schema Zod.
 * Lanza Error con mensaje legible si la validación falla.
 * Útil para validar request body en middleware de Express.
 *
 * @param schema - Schema Zod a usar para validación
 * @returns Función que valida y retorna datos tipados o lanza Error
 *
 * Uso:
 * ```typescript
 * const validateUser = createValidationSchema(userSchema);
 * const userData = validateUser(req.body); // Lanza si inválido
 * ```
 */
export const createValidationSchema = <T extends z.ZodTypeAny>(schema: T) => {
  return (data: unknown): z.infer<T> => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages?.join(', ') || ''}`)
        .join('; ');
      throw new Error(message);
    }
    return result.data;
  };
};

/**
 * Schema estándar para parámetros de paginación.
 * Coerce automáticamente strings a números (query params vienen como string).
 * Límites: page >= 1, limit 1-100, sortOrder enum asc/desc.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Schema para validar ID numérico en path params (ej: /clients/:id).
 * Coerce string a number y valida entero positivo.
 */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Schema para rango de fechas opcional en queries.
 * Coerce strings ISO a Date objects.
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Tipos inferidos para uso en controllers/services
export type PaginationParams = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type DateRangeParams = z.infer<typeof dateRangeSchema>;

/**
 * Interfaz estándar para respuestas paginadas.
 * Incluye metadatos de paginación para UI (total pages, etc).
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Construye respuesta paginada estándar a partir de datos y total count.
 * Calcula totalPages automáticamente.
 *
 * @param data - Array de elementos de la página actual
 * @param total - Total de elementos en BD (sin paginar)
 * @param params - Parámetros de paginación (page, limit)
 * @returns Respuesta formateada con metadatos
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}