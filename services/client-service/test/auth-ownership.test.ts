import { describe, expect, it, vi } from 'vitest';
import { requireUserSelf } from '../src/middleware/auth.middleware.js';
import { updateOwnClientValidation } from '../src/controllers/client.controller.js';

describe('client self-service route authorization', () => {
  it('allows a member to retrieve the client profile linked to their own user ID', () => {
    const next = () => undefined;
    const request = {
      user: { sub: '42', role: 'member' },
      params: { userId: '42' },
    };

    expect(() => requireUserSelf(request as never, {} as never, next)).not.toThrow();
  });

  it('rejects a member trying to access another user profile', () => {
    const request = {
      user: { sub: '42', role: 'member' },
      params: { userId: '43' },
    };

    expect(() => requireUserSelf(request as never, {} as never, () => undefined)).toThrow();
  });

  it('accepts and retains only the self-service contact fields', () => {
    const request = {
      body: {
        phone: '+51987654324',
        address: 'Av. Principal 123',
        emergencyContactName: 'Contacto local',
        status: 'suspended',
        dni: '00000000',
      },
    };
    const next = vi.fn();

    updateOwnClientValidation(request as never, {} as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(request.body).toEqual({
      phone: '+51987654324',
      address: 'Av. Principal 123',
      emergencyContactName: 'Contacto local',
    });
  });
});
