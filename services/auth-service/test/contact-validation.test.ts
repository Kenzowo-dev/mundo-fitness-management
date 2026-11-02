import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import {
  registerValidation,
  updateSelfValidation,
  updateUserValidation,
} from '../src/controllers/auth.controller.js';

const runValidation = (validator: typeof registerValidation, body: unknown) => {
  const next = vi.fn();
  validator({ body } as Request, {} as Response, next);
  return next;
};

describe('Account phone validation', () => {
  const validRegistration = {
    email: 'ana@example.com',
    password: 'password123',
    firstName: 'Ana',
    lastName: 'Pérez',
  };

  it('accepts a phone with up to nine numeric digits at registration', () => {
    const next = runValidation(registerValidation, { ...validRegistration, phone: '987654321' });
    expect(next).toHaveBeenCalledOnce();
  });

  it.each(['98765A321', '1234567890'])('rejects invalid phone %s at registration', (phone) => {
    expect(() => runValidation(registerValidation, { ...validRegistration, phone })).toThrow();
  });

  it('accepts names with accents, ñ and spaces', () => {
    const next = runValidation(registerValidation, { ...validRegistration, firstName: 'José María', lastName: 'Núñez Peña' });
    expect(next).toHaveBeenCalledOnce();
  });

  it.each(['Ana2', 'Ana_Lucía', 'Ana-Lucía', '123'])('rejects name %s at registration', (name) => {
    expect(() => runValidation(registerValidation, { ...validRegistration, firstName: name })).toThrow();
    expect(() => runValidation(registerValidation, { ...validRegistration, lastName: name })).toThrow();
  });

  it('rejects a future birth date and unknown gender at registration', () => {
    expect(() => runValidation(registerValidation, { ...validRegistration, birthDate: '2999-01-01' })).toThrow();
    expect(() => runValidation(registerValidation, { ...validRegistration, gender: 'xyz' })).toThrow();
    expect(runValidation(registerValidation, { ...validRegistration, birthDate: '1995-06-15', gender: 'femenino' })).toHaveBeenCalledOnce();
  });

  it('rejects names with numbers on account updates', () => {
    expect(() => runValidation(updateSelfValidation, { firstName: 'Ana2' })).toThrow();
    expect(() => runValidation(updateUserValidation, { lastName: 'Pérez9' })).toThrow();
  });

  it('rejects invalid phone values on account updates', () => {
    expect(() => runValidation(updateSelfValidation, { phone: '+51987654321' })).toThrow();
    expect(() => runValidation(updateUserValidation, { phone: '1234567890' })).toThrow();
  });
});
