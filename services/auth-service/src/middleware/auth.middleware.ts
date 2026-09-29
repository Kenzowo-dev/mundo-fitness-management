import type { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyAccessToken, TokenPayload } from '@gym/shared/utils/jwt.js';
import { logger } from '@gym/shared/logger/index.js';
import { AuthenticationError, AuthorizationError } from '@gym/shared/errors/index.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    throw new AuthenticationError('Access token required', 'TOKEN_MISSING');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.debug({ err: error }, 'Token verification failed');
    throw new AuthenticationError('Invalid or expired token', 'TOKEN_INVALID');
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required', 'NOT_AUTHENTICATED');
    }

    const userRole = req.user.role;
    const userPermissions = req.user.permissions || [];

    const hasRole = allowedRoles.includes(userRole);
    const hasPermission = allowedRoles.some((role) => userPermissions.includes(role) || userPermissions.includes('*'));

    if (!hasRole && !hasPermission) {
      throw new AuthorizationError(
        `Required role(s): ${allowedRoles.join(', ')}`,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}