import { describe, expect, it, vi } from 'vitest';
import { updateSelfValidation, updateUserValidation } from '../src/controllers/auth.controller.js';

function run(validation: (req: never, res: never, next: () => void) => void, body: Record<string, unknown>) {
  const request = { body };
  const next = vi.fn();
  validation(request as never, {} as never, next);
  return { request, next };
}

describe('profile update validation', () => {
  it('accepts letters-only names and a 9-digit phone, trimming spaces', () => {
    const { next, request } = run(updateSelfValidation, { firstName: ' Ana María ', lastName: 'Pérez', phone: '987654321' });
    expect(next).toHaveBeenCalledOnce();
    expect(request.body).toMatchObject({ firstName: 'Ana María', phone: '987654321' });
  });

  it('allows clearing the phone', () => {
    expect(run(updateSelfValidation, { phone: '' }).next).toHaveBeenCalledOnce();
  });

  it.each([
    [{ firstName: 'Ana2' }, 'firstName'],
    [{ lastName: 'Pérez$' }, 'lastName'],
    [{ phone: 'abc123' }, 'phone'],
    [{ phone: '12345678' }, 'phone'],
    [{ birthDate: '1949-12-31' }, 'birthDate'],
  ])('rejects %o', (body, field) => {
    expect(() => run(updateSelfValidation, body)).toThrow(new RegExp(`${field}:`));
    expect(() => run(updateUserValidation, body)).toThrow(new RegExp(`${field}:`));
  });
});
