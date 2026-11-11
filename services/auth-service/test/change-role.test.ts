import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query, clientQuery, transaction, publish } = vi.hoisted(() => {
  const query = vi.fn();
  const clientQuery = vi.fn();
  const transaction = vi.fn((callback: (client: { query: typeof clientQuery }) => Promise<unknown>) => callback({ query: clientQuery }));
  return { query, clientQuery, transaction, publish: vi.fn() };
});

vi.mock('@gym/shared/database/index.js', () => ({ query, transaction }));
vi.mock('@gym/shared/messaging/index.js', () => ({ publish, CHANNELS: { USER_UPDATED: 'user.updated' } }));

import { changeUserRole } from '../src/services/auth.service.js';

const now = new Date('2026-11-11T12:00:00Z');
const row = (overrides: Record<string, unknown> = {}) => ({
  id: 3, email: 'socio@mundofitness.com', password_hash: 'hash', first_name: 'Juan', last_name: 'Pérez',
  phone: null, birth_date: null, gender: null, role: 'member', is_active: true,
  email_verified: true, last_login_at: null, created_at: now, updated_at: now,
  ...overrides,
});

const ADMIN_ID = 1;

describe('cambio de rol de una cuenta (solo admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientQuery.mockResolvedValue({ rows: [] });
  });

  it('cambia un socio a recepcionista, sincroniza user_roles y cierra sus sesiones', async () => {
    query.mockResolvedValueOnce({ rows: [row()] });
    clientQuery.mockResolvedValueOnce({ rows: [row({ role: 'receptionist' })] });

    const user = await changeUserRole(ADMIN_ID, 3, 'receptionist');

    expect(user.role).toBe('receptionist');
    expect(transaction).toHaveBeenCalledOnce();
    const sql = clientQuery.mock.calls.map((call) => call[0] as string);
    expect(sql[0]).toContain('UPDATE users SET role');
    expect(clientQuery.mock.calls[0][1]).toEqual(['receptionist', 3]);
    expect(sql[1]).toContain('DELETE FROM user_roles');
    expect(sql[2]).toContain('INSERT INTO user_roles');
    expect(clientQuery.mock.calls[2][1]).toEqual([3, 'receptionist']);
    expect(sql[3]).toContain('DELETE FROM refresh_tokens');
    expect(publish).toHaveBeenCalledWith('user.updated', expect.objectContaining({ userId: 3, role: 'receptionist' }));
  });

  it('no permite que el admin cambie su propio rol', async () => {
    await expect(changeUserRole(ADMIN_ID, ADMIN_ID, 'member')).rejects.toMatchObject({
      statusCode: 403,
      code: 'CANNOT_CHANGE_OWN_ROLE',
    });
    expect(query).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('no permite cambiar el rol de otra cuenta de administrador', async () => {
    query.mockResolvedValueOnce({ rows: [row({ id: 2, role: 'admin' })] });

    await expect(changeUserRole(ADMIN_ID, 2, 'member')).rejects.toMatchObject({
      statusCode: 403,
      code: 'CANNOT_CHANGE_ADMIN_ROLE',
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('devuelve 404 si la cuenta no existe', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(changeUserRole(ADMIN_ID, 999, 'receptionist')).rejects.toMatchObject({ statusCode: 404 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('no hace nada si la cuenta ya tiene ese rol', async () => {
    query.mockResolvedValueOnce({ rows: [row({ role: 'receptionist' })] });

    const user = await changeUserRole(ADMIN_ID, 3, 'receptionist');

    expect(user.role).toBe('receptionist');
    expect(transaction).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });
});
