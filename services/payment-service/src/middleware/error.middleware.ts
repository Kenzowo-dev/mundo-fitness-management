import type { Request, Response, NextFunction } from 'express';
import { getRequestLogger } from '@gym/shared/logger/index.js';
import { isAppError } from '@gym/shared/errors/index.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestLogger = getRequestLogger(req);
  // Los errores de JSON malformado son errores del cliente.
  const parseError = err as Error & {
    status?: number;
    statusCode?: number;
    type?: string;
  };

  if (
    parseError.type === 'entity.parse.failed' &&
    (parseError.status === 400 || parseError.statusCode === 400)
  ) {
    requestLogger.warn({ err }, 'Invalid JSON request body');
    res.status(400).json({
      error: {
        message: 'Invalid JSON request body',
        code: 'INVALID_JSON',
      },
    });
    return;
  }

  if (isAppError(err)) {
    const statusCode = err.statusCode;
    const errorResponse: { message: string; code?: string; details?: unknown } = {
      message: err.message,
      code: err.code,
    };

    if (err.details !== undefined) {
      errorResponse.details = err.details;
    }

    if (statusCode >= 500) {
      requestLogger.error({ err, statusCode }, 'Server error');
    } else {
      requestLogger.warn({ err, statusCode }, 'Client error');
    }

    res.status(statusCode).json({ error: errorResponse });
    return;
  }

  requestLogger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
