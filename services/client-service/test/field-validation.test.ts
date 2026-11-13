import { describe, expect, it, vi } from 'vitest';
import {
  createClientValidation,
  ownGoalValidation,
  updateClientValidation,
  updateOwnClientValidation,
} from '../src/controllers/client.controller.js';

function run(validation: (req: never, res: never, next: () => void) => void, body: Record<string, unknown>) {
  const request = { body };
  const next = vi.fn();
  validation(request as never, {} as never, next);
  return { request, next };
}

const validClient = { dni: '71234567', firstName: 'Juan José', lastName: 'Pérez Ñúñez' };

describe('client field validation', () => {
  it('accepts a client with letters-only names, 9-digit phones and a normal address', () => {
    const { next, request } = run(createClientValidation, {
      ...validClient,
      phone: '987654321',
      emergencyContactName: 'María López',
      emergencyContactPhone: '912345678',
      address: 'Av. Perú 450, Dpto. 3-B',
    });
    expect(next).toHaveBeenCalledOnce();
    expect(request.body).toMatchObject({ firstName: 'Juan José', address: 'Av. Perú 450, Dpto. 3-B' });
  });

  it.each([
    ['dni', { dni: '12ab$%cd' }, 'dni'],
    ['nombre con números', { firstName: 'Juan2' }, 'firstName'],
    ['apellido con guion', { lastName: 'García-Pérez' }, 'lastName'],
    ['teléfono con letras', { phone: '98765432a' }, 'phone'],
    ['teléfono con +51', { phone: '+51987654321' }, 'phone'],
    ['contacto con signos', { emergencyContactName: 'Rosa!' }, 'emergencyContactName'],
    ['dirección con signos', { address: 'Calle 1 $%&' }, 'address'],
    ['nacido antes de 1950', { birthDate: '1949-12-31' }, 'birthDate'],
    ['fecha futura', { birthDate: '2999-01-01' }, 'birthDate'],
  ])('rejects %s', (_label, override, field) => {
    expect(() => run(createClientValidation, { ...validClient, ...override })).toThrow(new RegExp(`${field}:`));
  });

  it('lets empty optional fields through so they can be cleared', () => {
    const { next } = run(updateClientValidation, { phone: '', address: '', emergencyContactName: '', emergencyContactPhone: '' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('applies the same rules to the member self-service profile', () => {
    expect(() => run(updateOwnClientValidation, { emergencyContactName: 'Pepe123' })).toThrow(/emergencyContactName:/);
    expect(() => run(updateOwnClientValidation, { phone: '12345' })).toThrow(/phone:/);
  });

  it('only accepts letters, % and / as goal unit and non-negative values', () => {
    expect(run(ownGoalValidation, { goalType: 'weight', unit: 'km/h', targetValue: 10 }).next).toHaveBeenCalledOnce();
    expect(() => run(ownGoalValidation, { goalType: 'weight', unit: 'kg2' })).toThrow(/unit:/);
    expect(() => run(ownGoalValidation, { goalType: 'weight', targetValue: -5 })).toThrow(/targetValue:/);
  });
});
