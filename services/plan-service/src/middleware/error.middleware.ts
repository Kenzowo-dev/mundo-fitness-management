import type { Request, Response, NextFunction } from 'express';
import { logger } from '@gym/shared/logger/index.js';
import { isAppError } from '@gym/shared/errors/index.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
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
      logger.error({ err, statusCode }, 'Server error');
    } else {
      logger.warn({ err, statusCode }, 'Client error');
    }

    res.status(statusCode).json({ error: errorResponse });
    return;
  }

  logger.error({ err }, 'Unhandled error');
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

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
