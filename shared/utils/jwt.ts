import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';

/**
 * Payload estándar del access token.
 * Extiende JwtPayload con claims requeridos por la aplicación.
 * sub = user ID, email/role/permissions para autorización sin DB lookup.
 */
export interface TokenPayload extends JwtPayload {
  /** Identificador único del usuario (subject) */
  sub: string;
  /** Email del usuario para logging y auditoría */
  email: string;
  /** Rol principal: 'admin' | 'receptionist' | 'member' */
  role: string;
  /** Permisos granulares para RBAC fino */
  permissions: string[];
}

/**
 * Payload del refresh token.
 * Mínimo: solo user ID y tipo para distinguir de access tokens.
 */
export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  type: 'refresh';
}

/**
 * Genera un access token JWT de corta duración (ej: 15 minutos).
 * Incluye claims de issuer/audience para validación cruzada entre servicios.
 *
 * @param payload - Datos del usuario sin iat/exp (se añaden automáticamente)
 * @returns Token JWT firmado con RS256/HS256 según configuración
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
    issuer: 'gym-system',
    audience: 'gym-api',
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Genera un refresh token JWT de larga duración (ej: 7 días).
 * Payload mínimo para reducir superficie de ataque si se compromete.
 * Debe almacenarse hashed en BD y rotarse en cada uso (refresh token rotation).
 *
 * @param userId - ID del usuario (subject)
 * @returns Refresh token firmado
 */
export function generateRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: 'refresh',
    jti: randomUUID(),
  };
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    issuer: 'gym-system',
    audience: 'gym-api',
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Verifica y decodifica un access token.
 * Valida firma, expiración, issuer y audience.
 * Lanza JsonWebTokenError si el token es inválido/expired.
 *
 * @param token - JWT string a verificar
 * @returns Payload tipado con datos del usuario
 * @throws JsonWebTokenError si verificación falla
 */
export function verifyAccessToken(token: string): TokenPayload {
  const options: VerifyOptions = {
    issuer: 'gym-system',
    audience: 'gym-api',
  };
  try {
    return jwt.verify(token, config.jwt.secret, options) as TokenPayload;
  } catch (error) {
    logger.debug({ err: error }, 'Access token verification failed');
    throw error;
  }
}

/**
 * Verifica y decodifica un refresh token.
 * Misma validación que access token pero acepta solo type='refresh'.
 *
 * @param token - Refresh token string
 * @returns Payload con user ID
 * @throws JsonWebTokenError si verificación falla
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const options: VerifyOptions = {
    issuer: 'gym-system',
    audience: 'gym-api',
  };
  try {
    return jwt.verify(token, config.jwt.secret, options) as RefreshTokenPayload;
  } catch (error) {
    logger.debug({ err: error }, 'Refresh token verification failed');
    throw error;
  }
}

/**
 * Decodifica un token SIN verificar la firma.
 * Útil para leer claims (expiración, user ID) antes de decidir si verificar.
 * NO usar para autorización - solo para logging, debugging o routing.
 *
 * @param token - JWT string
 * @returns Payload decodificado o null si formato inválido
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extrae el token Bearer del header Authorization.
 * Formato esperado: "Bearer <token>"
 * Retorna null si header ausente, malformado o scheme incorrecto.
 *
 * @param authHeader - Valor del header Authorization
 * @returns Token string o null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}
