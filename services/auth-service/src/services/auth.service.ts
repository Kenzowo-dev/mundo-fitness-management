import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { query, transaction, PoolClient } from '@gym/shared/database/index.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '@gym/shared/utils/jwt.js';
import { logger } from '@gym/shared/logger/index.js';
import { publish } from '@gym/shared/messaging/index.js';
import { CHANNELS } from '@gym/shared/messaging/index.js';
import { sendPasswordResetEmail, DevLogEmailProvider, setEmailProvider } from '@gym/shared/utils/email.js';
import {
  User,
  CreateUserData,
  UpdateUserData,
  TokenPair,
  RefreshTokenRecord,
  Role,
} from '../models/user.js';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '@gym/shared/errors/index.js';
import jwt from 'jsonwebtoken';

const BCRYPT_ROUNDS = 12;

// Configurar proveedor de email según entorno
if (process.env.NODE_ENV !== 'production') {
  setEmailProvider(new DevLogEmailProvider());
}

function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashRefreshToken(token: string): string {
  // Refresh JWTs are high-entropy secrets; a full-length digest avoids bcrypt's 72-byte truncation.
  return createHash('sha256').update(token).digest('hex');
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  birth_date: Date | null;
  gender: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
}

export interface PasswordResetTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export interface RoleRow {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: Date;
}

export interface CountRow {
  count: string;
}

export function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone ?? undefined,
    birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
    gender: row.gender ?? undefined,
    role: row.role,
    isActive: row.is_active,
    emailVerified: row.email_verified,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function registerUser(data: CreateUserData): Promise<{ user: User; tokens: TokenPair }> {
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existingUser.rows.length > 0) {
    throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(data.password);

  const registration = await transaction(async (client) => {
    const userResult = await client.query<UserRow>(
      `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, birth_date, gender, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, password_hash, first_name, last_name, phone, birth_date, gender, role, is_active, email_verified, last_login_at, created_at, updated_at
      `,
      [data.email, passwordHash, data.firstName, data.lastName, data.phone ?? null, data.birthDate ?? null, data.gender ?? null, data.role ?? 'member']
    );

    const user = mapRowToUser(userResult.rows[0]);
    const tokens = await createTokenPair(user.id, user.email, user.role);

    await storeRefreshToken(client, user.id, tokens.refreshToken);

    return { user, tokens };
  });

  // Publish only after the user row is committed, so client-service can safely reference its ID.
  await publish(CHANNELS.USER_CREATED, {
    userId: registration.user.id,
    email: registration.user.email,
    role: registration.user.role,
    firstName: registration.user.firstName,
    lastName: registration.user.lastName,
    phone: registration.user.phone,
    birthDate: registration.user.birthDate?.toISOString(),
    gender: registration.user.gender,
  });

  logger.info({ userId: registration.user.id }, 'User registered successfully');
  return registration;
}

export async function loginUser(email: string, password: string): Promise<{ user: User; tokens: TokenPair }> {
  const result = await query<UserRow>(
    `SELECT id, email, password_hash, first_name, last_name, phone, birth_date, gender, role, is_active, email_verified, last_login_at, created_at, updated_at
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AuthenticationError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const userRow = result.rows[0];
  const isValid = await comparePassword(password, userRow.password_hash);

  if (!isValid) {
    throw new AuthenticationError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  if (!userRow.is_active) {
    throw new AuthenticationError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
  }

  const user = mapRowToUser(userRow);
  const tokens = await createTokenPair(user.id, user.email, user.role);

  await storeRefreshToken(null, user.id, tokens.refreshToken);

  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  logger.info({ userId: user.id }, 'User logged in successfully');
  return { user, tokens };
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  let payload: { sub: string; type: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthenticationError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (payload.type !== 'refresh') {
    throw new AuthenticationError('Invalid token type', 'INVALID_TOKEN_TYPE');
  }

  const tokenRecords = await findValidRefreshTokens(Number(payload.sub), refreshToken);
  if (tokenRecords.length === 0) {
    throw new AuthenticationError('Refresh token revoked or expired', 'TOKEN_REVOKED');
  }

  const userResult = await query<Pick<UserRow, 'id' | 'email' | 'role'>>(
    `SELECT id, email, role FROM users WHERE id = $1 AND is_active = true`,
    [payload.sub]
  );

  if (userResult.rows.length === 0) {
    throw new AuthenticationError('User not found or inactive', 'USER_NOT_FOUND');
  }

  const user = userResult.rows[0];
  const tokens = await createTokenPair(user.id, user.email, user.role);

  await Promise.all(tokenRecords.map(({ id }) => revokeRefreshToken(id)));
  await storeRefreshToken(null, user.id, tokens.refreshToken);

  return tokens;
}

export async function logoutUser(userId: number, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    const tokenRecords = await findValidRefreshTokens(userId, refreshToken);
    await Promise.all(tokenRecords.map(({ id }) => revokeRefreshToken(id)));
  } else {
    await revokeAllUserRefreshTokens(userId);
  }
  logger.info({ userId }, 'User logged out');
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
  const result = await query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new NotFoundError('User', userId);
  }

  const isValid = await comparePassword(currentPassword, result.rows[0].password_hash);
  if (!isValid) {
    throw new AuthenticationError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
  }

  const newPasswordHash = await hashPassword(newPassword);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, userId]);

  await revokeAllUserRefreshTokens(userId);
  logger.info({ userId }, 'Password changed successfully');
}

export async function requestPasswordReset(email: string): Promise<void> {
  const result = await query<{ id: number; first_name: string }>('SELECT id, first_name FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    logger.warn({ email }, 'Password reset requested for non-existent email');
    return;
  }

  const userId = result.rows[0].id;
  const firstName = result.rows[0].first_name;
  const resetToken = generateResetToken();
  const tokenHash = hashResetToken(resetToken);
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  // Enviar email con token de recuperación
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`;
  await sendPasswordResetEmail({
    email,
    resetToken,
    expiresInHours: 1,
    firstName,
    resetUrl,
  });

  logger.info({ userId }, 'Password reset token created and email sent');
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashResetToken(token);
  const result = await query<Pick<PasswordResetTokenRow, 'id' | 'user_id'>>(
    `SELECT id, user_id FROM password_reset_tokens 
     WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    throw new ValidationError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
  }

  const resetToken = result.rows[0];
  const newPasswordHash = await hashPassword(newPassword);

  await transaction(async (client) => {
    await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, resetToken.user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [resetToken.id]);
    await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [resetToken.user_id]);
  });

  logger.info({ userId: resetToken.user_id }, 'Password reset completed');
}

function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function getUserById(userId: number): Promise<User | null> {
  const result = await query<UserRow>(
    `SELECT id, email, password_hash, first_name, last_name, phone, birth_date, gender, role, is_active, email_verified, last_login_at, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows.length > 0 ? mapRowToUser(result.rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query<UserRow>(
    `SELECT id, email, password_hash, first_name, last_name, phone, birth_date, gender, role, is_active, email_verified, last_login_at, created_at, updated_at
     FROM users WHERE email = $1`,
    [email]
  );
  return result.rows.length > 0 ? mapRowToUser(result.rows[0]) : null;
}

export async function updateUser(userId: number, data: UpdateUserData): Promise<User> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.firstName !== undefined) {
    fields.push(`first_name = $${paramIndex++}`);
    values.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    fields.push(`last_name = $${paramIndex++}`);
    values.push(data.lastName);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
  }
  if (data.birthDate !== undefined) {
    fields.push(`birth_date = $${paramIndex++}`);
    values.push(data.birthDate);
  }
  if (data.gender !== undefined) {
    fields.push(`gender = $${paramIndex++}`);
    values.push(data.gender);
  }
  if (data.role !== undefined) {
    fields.push(`role = $${paramIndex++}`);
    values.push(data.role);
  }
  if (data.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }

  if (fields.length === 0) {
    const user = await getUserById(userId);
    if (!user) throw new NotFoundError('User', userId);
    return user;
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query<UserRow>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, email, password_hash, first_name, last_name, phone, birth_date, gender, role, is_active, email_verified, last_login_at, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User', userId);
  }

  const user = mapRowToUser(result.rows[0]);
  await publish(CHANNELS.USER_UPDATED, { userId: user.id, email: user.email, role: user.role });
  return user;
}

export async function deleteUser(userId: number): Promise<void> {
  const result = await query('DELETE FROM users WHERE id = $1', [userId]);
  if (result.rowCount === 0) {
    throw new NotFoundError('User', userId);
  }
  await publish(CHANNELS.USER_DELETED, { userId });
  logger.info({ userId }, 'User deleted');
}

export async function listUsers(page: number, limit: number): Promise<{ users: User[]; total: number }> {
  const offset = (page - 1) * limit;
  const [usersResult, countResult] = await Promise.all([
    query<UserRow>(
      `SELECT id, email, password_hash, first_name, last_name, phone, birth_date, gender, role, is_active, email_verified, last_login_at, created_at, updated_at
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query<CountRow>('SELECT COUNT(*) FROM users'),
  ]);

  return {
    users: usersResult.rows.map(mapRowToUser),
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getRoles(): Promise<Role[]> {
  const result = await query<RoleRow>('SELECT id, name, description, permissions, created_at FROM roles ORDER BY id');
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    permissions: row.permissions,
    createdAt: new Date(row.created_at),
  }));
}

async function createTokenPair(userId: number, email: string, role: string): Promise<TokenPair> {
  const permissions = await getUserPermissions(role);
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: String(userId),
    email,
    role,
    permissions,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(String(userId));
  const decoded = jwt.decode(accessToken) as { exp: number };
  const expiresIn = decoded.exp * 1000 - Date.now();
  return { accessToken, refreshToken, expiresIn };
}

async function getUserPermissions(role: string): Promise<string[]> {
  const result = await query<{ permissions: string[] }>('SELECT permissions FROM roles WHERE name = $1', [role]);
  if (result.rows.length > 0) {
    return result.rows[0].permissions;
  }
  return [];
}

async function storeRefreshToken(client: PoolClient | null, userId: number, refreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const queryText = `
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
  `;

  if (client) {
    await client.query(queryText, [userId, tokenHash, expiresAt]);
  } else {
    await query(queryText, [userId, tokenHash, expiresAt]);
  }
}

async function findValidRefreshTokens(userId: number, refreshToken: string): Promise<RefreshTokenRecord[]> {
  const result = await query<RefreshTokenRow>(
    `SELECT id, user_id, token_hash, expires_at, created_at, revoked_at
     FROM refresh_tokens
     WHERE user_id = $1 AND expires_at > NOW() AND revoked_at IS NULL`,
    [userId]
  );

  const matches: RefreshTokenRecord[] = [];
  const tokenHash = hashRefreshToken(refreshToken);
  for (const row of result.rows) {
    if (tokenHash === row.token_hash) {
      matches.push({
        id: row.id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: new Date(row.expires_at),
        createdAt: new Date(row.created_at),
        revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
      });
    }
  }
  return matches;
}

async function revokeRefreshToken(tokenId: number): Promise<void> {
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [tokenId]);
}

async function revokeAllUserRefreshTokens(userId: number): Promise<void> {
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
}
