import { AuthorizationError } from '../errors/index.js';
import { pool } from '../database/index.js';

export interface TokenUser {
  sub: string;
  email?: string;
  role?: string;
  permissions?: string[];
}

export interface AuthenticatedRequest<P = Record<string, string>> {
  user?: TokenUser;
  params: P;
}

export type ResourceOwnerChecker<P = Record<string, string>> = (
  req: AuthenticatedRequest<P>,
  resourceId: number | string
) => Promise<boolean>;

export function requireOwnership<P extends Record<string, string>>(
  resourceTable: string,
  ownerColumn: string,
  idParamName: keyof P = 'id' as keyof P
) {
  return async (req: AuthenticatedRequest<P>, _res: unknown, next: (err?: Error) => void) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required', 'NOT_AUTHENTICATED');
    }

    const userId = Number(req.user.sub);
    const userRole = req.user.role;
    const resourceId = req.params[idParamName];

    if (!resourceId) {
      throw new AuthorizationError('Resource ID required', 'MISSING_RESOURCE_ID');
    }

    const isAdmin = userRole === 'admin';

    if (isAdmin) {
      return next();
    }

    try {
      const queryText = `SELECT 1 FROM ${resourceTable} WHERE ${ownerColumn} = $1 AND ${idParamName === 'id' ? 'id' : String(idParamName)} = $2`;
      const result = await pool.query(queryText, [userId, resourceId]);

      if (result.rows.length === 0) {
        throw new AuthorizationError('Access denied to this resource', 'FORBIDDEN');
      }

      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw error;
      }
      throw new AuthorizationError('Error checking resource ownership', 'OWNERSHIP_CHECK_FAILED');
    }
  };
}

export function requireClientOwnership<P extends Record<string, string>>(idParamName: keyof P = 'clientId' as keyof P) {
  return requireOwnership('clients', 'user_id', idParamName);
}

export function requireMembershipOwnership<P extends Record<string, string>>(idParamName: keyof P = 'id' as keyof P) {
  return requireOwnership('client_memberships', 'client_id', idParamName);
}

export function requirePaymentOwnership<P extends Record<string, string>>(idParamName: keyof P = 'id' as keyof P) {
  return requireOwnership('payments', 'client_id', idParamName);
}

export function requireInvoiceOwnership<P extends Record<string, string>>(idParamName: keyof P = 'id' as keyof P) {
  return requireOwnership('invoices', 'client_id', idParamName);
}

export function requireClientPlanOwnership<P extends Record<string, string>>(idParamName: keyof P = 'clientPlanId' as keyof P) {
  return requireOwnership('client_plans', 'client_id', idParamName);
}

export function requireDashboardOwnership<P extends Record<string, string>>(idParamName: keyof P = 'id' as keyof P) {
  return requireOwnership('user_dashboards', 'user_id', idParamName);
}

export function requireUserSelfOrAdmin<P extends Record<string, string>>(idParamName: keyof P = 'id' as keyof P) {
  return (req: AuthenticatedRequest<P>, _res: unknown, next: (err?: Error) => void) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required', 'NOT_AUTHENTICATED');
    }

    const userId = Number(req.user.sub);
    const userRole = req.user.role;
    const targetId = parseInt(String(req.params[idParamName]), 10);

    if (userRole === 'admin' || userId === targetId) {
      return next();
    }

    throw new AuthorizationError('Access denied to this resource', 'FORBIDDEN');
  };
}