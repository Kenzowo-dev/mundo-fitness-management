import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query, clientQuery, transaction, publish } = vi.hoisted(() => {
  const query = vi.fn();
  const clientQuery = vi.fn();
  const transaction = vi.fn((callback: (client: { query: typeof clientQuery }) => Promise<unknown>) => callback({ query: clientQuery }));
  return { query, clientQuery, transaction, publish: vi.fn() };
});

vi.mock('@gym/shared/database/index.js', () => ({ query, transaction }));
vi.mock('@gym/shared/messaging/index.js', () => ({ publish, CHANNELS: {} }));

import { registerUser } from '../src/services/auth.service.js';

const now = new Date('2026-10-19T12:00:00Z');
const userRow = {
  id: 42, email: 'nuevo@example.com', password_hash: 'hash', first_name: 'Ana', last_name: 'Paz',
  phone: null, birth_date: null, gender: null, role: 'member', is_active: true,
  email_verified: false, last_login_at: null, created_at: now, updated_at: now,
};
const registration = { email: userRow.email, password: 'ClaveSegura123!', firstName: 'Ana', lastName: 'Paz' };

describe('registro de socios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.mockResolvedValue({ rows: [] });
    clientQuery.mockResolvedValue({ rows: [] });
  });

  it('guarda cuenta, ficha y token en la misma transacción', async () => {
    clientQuery
      .mockResolvedValueOnce({ rows: [userRow] })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] });

    const result = await registerUser(registration);

    expect(result.user.id).toBe(42);
    expect(transaction).toHaveBeenCalledOnce();
    expect(clientQuery).toHaveBeenCalledTimes(3);
    expect(clientQuery.mock.calls[1][0]).toContain('INSERT INTO clients');
    expect(clientQuery.mock.calls[1][1]).toEqual([42, 'CLI-42', 'Ana', 'Paz', userRow.email, null, null, null]);
    expect(clientQuery.mock.calls[2][0]).toContain('INSERT INTO refresh_tokens');
    expect(publish).not.toHaveBeenCalled();
  });

  it('rechaza una ficha ya existente antes de crear tokens', async () => {
    clientQuery.mockResolvedValueOnce({ rows: [userRow] });

    await expect(registerUser(registration)).rejects.toMatchObject({ code: 'CLIENT_EXISTS' });

    expect(transaction).toHaveBeenCalledOnce();
    expect(clientQuery).toHaveBeenCalledTimes(2);
    expect(publish).not.toHaveBeenCalled();
  });

  it('rechaza un correo duplicado aunque aparezca durante el registro', async () => {
    await expect(registerUser(registration)).rejects.toMatchObject({ code: 'EMAIL_EXISTS' });

    expect(clientQuery).toHaveBeenCalledOnce();
    expect(clientQuery.mock.calls[0][0]).toContain('ON CONFLICT (email) DO NOTHING');
  });
});
