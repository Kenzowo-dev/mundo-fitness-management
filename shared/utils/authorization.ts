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
  body?: Record<string, unknown>;
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

    // Staff routes already enforce their role before this ownership check.
    // Ownership applies only to self-service roles; otherwise reception could
    // never access another member's record.
    const isStaff = ['admin', 'receptionist'].includes(userRole ?? '');

    if (isStaff) {
      return next();
    }

    const resourceId = req.params[idParamName];
    if (!resourceId) {
      throw new AuthorizationError('Resource ID required', 'MISSING_RESOURCE_ID');
    }

    try {
      // Route parameter names are API vocabulary; the protected rows use their
      // primary-key column (`id`) regardless of whether the URL calls it
      // `membershipId`, `clientPlanId`, or something else.
      const resourceIdColumn = 'id';
      const clientOwnedTables = ['client_memberships', 'payments', 'invoices'];
      const queryText = resourceTable === 'clients'
        ? `SELECT 1 FROM clients WHERE user_id = $1 AND id = $2`
        : clientOwnedTables.includes(resourceTable)
          ? `SELECT 1 FROM ${resourceTable} resource JOIN clients client ON client.id = resource.client_id WHERE client.user_id = $1 AND resource.${resourceIdColumn} = $2`
          : `SELECT 1 FROM ${resourceTable} WHERE ${ownerColumn} = $1 AND ${resourceIdColumn} = $2`;
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

export function requireClientBodyOwnership() {
  return async (
    req: AuthenticatedRequest,
    res: unknown,
    next: (err?: Error) => void,
  ) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required', 'NOT_AUTHENTICATED');
    }

    const clientId = req.body?.clientId;
    if (typeof clientId !== 'number' || !Number.isInteger(clientId) || clientId < 1) {
      throw new AuthorizationError('Client ID required', 'MISSING_CLIENT_ID');
    }

    const ownershipCheck = requireClientOwnership<{ clientId: string }>('clientId');
    await ownershipCheck(
      { user: req.user, params: { clientId: String(clientId) } },
      res,
      next,
    );
  };
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
