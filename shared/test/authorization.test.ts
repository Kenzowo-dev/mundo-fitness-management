import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('../database/index.js', () => ({ pool: { query } }));

import {
  requireClientOwnership,
  requireClientBodyOwnership,
  requireMembershipOwnership,
  requirePaymentOwnership,
} from '../utils/authorization.js';

describe('resource ownership authorization', () => {
  beforeEach(() => query.mockReset());

  it('checks that a member owns the client profile requested by client ID', async () => {
    query.mockResolvedValue({ rows: [{ id: 11 }] });
    const next = vi.fn();

    await requireClientOwnership('clientId')(
      { user: { sub: '42', role: 'member' }, params: { clientId: '11' } },
      {},
      next,
    );

    expect(query).toHaveBeenCalledWith(
      'SELECT 1 FROM clients WHERE user_id = $1 AND id = $2',
      [42, '11'],
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('checks membership ownership through the related client profile', async () => {
    query.mockResolvedValue({ rows: [{ id: 7 }] });
    const next = vi.fn();

    await requireMembershipOwnership('id')(
      { user: { sub: '42', role: 'member' }, params: { id: '7' } },
      {},
      next,
    );

    expect(query).toHaveBeenCalledWith(
      'SELECT 1 FROM client_memberships resource JOIN clients client ON client.id = resource.client_id WHERE client.user_id = $1 AND resource.id = $2',
      [42, '7'],
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('checks payment ownership through the related client profile', async () => {
    query.mockResolvedValue({ rows: [] });
    const next = vi.fn();

    await expect(requirePaymentOwnership('id')(
      { user: { sub: '42', role: 'member' }, params: { id: '9' } },
      {},
      next,
    )).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows authorized staff routes to reach the controller without a self-owned ID', async () => {
    const next = vi.fn();

    await requireClientOwnership('clientId')(
      { user: { sub: '2', role: 'receptionist' }, params: {} },
      {},
      next,
    );

    expect(query).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it('checks ownership of the client ID supplied in the payment-method request body', async () => {
    query.mockResolvedValue({ rows: [] });
    const next = vi.fn();

    await expect(requireClientBodyOwnership()(
      { user: { sub: '42', role: 'member' }, params: {}, body: { clientId: 12 } },
      {},
      next,
    )).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(query).toHaveBeenCalledWith(
      'SELECT 1 FROM clients WHERE user_id = $1 AND id = $2',
      [42, '12'],
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('does not treat trainer accounts as staff for owner checks', async () => {
    query.mockResolvedValue({ rows: [] });
    const next = vi.fn();

    await expect(requireClientOwnership('clientId')(
      { user: { sub: '43', role: 'trainer' }, params: { clientId: '12' } },
      {},
      next,
    )).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(query).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });
});
