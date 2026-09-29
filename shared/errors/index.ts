/**
 * Clase base para errores operacionales de la aplicación.
 * Diferencia entre errores operacionales (esperados, manejables) y errores de programación (bugs).
 * Incluye código de error estandarizado, status HTTP y detalles opcionales para debugging.
 */
export class AppError extends Error {
  /** Código de estado HTTP a retornar al cliente */
  public readonly statusCode: number;
  /** True si es error operacional (validación, auth, not found), false si es bug interno */
  public readonly isOperational: boolean;
  /** Código de error estandarizado para manejo en frontend (ej: 'VALIDATION_ERROR') */
  public readonly code?: string;
  /** Detalles adicionales para debugging o respuesta al cliente */
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Necesario para que instanceof funcione correctamente con clases extendidas en TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
    // Captura stack trace limpio apuntando al sitio de instanciación
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de validación de datos de entrada (400 Bad Request).
 * Se lanza cuando request body, query params o path params no pasan validación Zod.
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error de autenticación (401 Unauthorized).
 * Token faltante, inválido, expirado o credenciales incorrectas.
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', code = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error de autorización (403 Forbidden).
 * Usuario autenticado pero sin permisos para el recurso/acción.
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', code = 'FORBIDDEN') {
    super(message, 403, code);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Error de recurso no encontrado (404 Not Found).
 * Incluye recurso e identificador en details para logging y respuesta.
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier "${identifier}" not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, identifier });
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error de conflicto (409 Conflict).
 * Violación de unicidad, estado inválido para la operación, etc.
 */
export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT', details?: unknown) {
    super(message, 409, code, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error de rate limiting (429 Too Many Requests).
 * Incluye retryAfter opcional para header Retry-After.
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error interno del servidor (500 Internal Server Error).
 * isOperational = false: indica bug no manejado, requiere alerting/on-call.
 * No debe exponer detalles sensibles al cliente en producción.
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(message, 500, 'INTERNAL_ERROR', details, false);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Error de servicio downstream no disponible (503 Service Unavailable).
 * Para fallos en llamadas a otros microservicios o dependencias externas.
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `Service ${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE', {
      service,
    });
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Type guard para verificar si un error es instancia de AppError.
 * Permite narrowing de tipos en catch blocks.
 *
 * @param error - Error desconocido (unknown)
 * @returns true si es AppError, false en caso contrario
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Verifica si un error es operacional (esperado y manejable).
 * Errores operacionales: validation, auth, not found, conflict, rate limit.
 * Errores no operacionales: internal server error, bugs de programación.
 *
 * @param error - Error desconocido
 * @returns true si es error operacional conocido
 */
export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}