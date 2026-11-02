import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import {
  createClientValidation,
  updateClientValidation,
  updateOwnClientValidation,
} from '../src/controllers/client.controller.js';

const runValidation = (validator: typeof createClientValidation, body: unknown) => {
  const next = vi.fn();
  validator({ body } as Request, {} as Response, next);
  return next;
};

describe('Client contact validation', () => {
  const validClient = { dni: '12345678', firstName: 'Ana', lastName: 'Pérez', email: 'ana@correo.com', phone: '987654321' };

  it('accepts an eight-digit numeric DNI and a phone of up to nine digits', () => {
    const next = runValidation(createClientValidation, {
      ...validClient,
      phone: '987654321',
      emergencyContactPhone: '98765432',
    });

    expect(next).toHaveBeenCalledOnce();
  });

  it.each(['1234567A', '123456789'])('rejects invalid DNI %s', (dni) => {
    expect(() => runValidation(createClientValidation, { ...validClient, dni })).toThrow();
  });

  it.each(['98765A321', '1234567890'])('rejects invalid phone %s', (phone) => {
    expect(() => runValidation(createClientValidation, { ...validClient, phone })).toThrow();
  });

  it('accepts names with accents, ñ and spaces', () => {
    const next = runValidation(createClientValidation, { ...validClient, firstName: 'José María', lastName: 'Núñez Peña' });
    expect(next).toHaveBeenCalledOnce();
  });

  it.each(['Ana2', 'Ana_Lucía', '123'])('rejects name %s', (name) => {
    expect(() => runValidation(createClientValidation, { ...validClient, firstName: name })).toThrow();
    expect(() => runValidation(createClientValidation, { ...validClient, lastName: name })).toThrow();
    expect(() => runValidation(updateClientValidation, { firstName: name })).toThrow();
  });

  it('requires email and phone when a socio is registered', () => {
    const { email, phone, ...withoutContact } = validClient;
    expect(() => runValidation(createClientValidation, { ...withoutContact, phone })).toThrow();
    expect(() => runValidation(createClientValidation, { ...withoutContact, email })).toThrow();
    expect(() => runValidation(createClientValidation, { ...validClient, phone: '' })).toThrow();
    expect(() => runValidation(updateClientValidation, { email: '' })).toThrow();
  });

  it('rejects a future or very old birth date', () => {
    expect(() => runValidation(createClientValidation, { ...validClient, birthDate: '2999-01-01' })).toThrow();
    expect(() => runValidation(createClientValidation, { ...validClient, birthDate: '1800-01-01' })).toThrow();
    expect(runValidation(createClientValidation, { ...validClient, birthDate: '1995-06-15' })).toHaveBeenCalledOnce();
  });

  it('accepts only known gender values', () => {
    expect(() => runValidation(createClientValidation, { ...validClient, gender: 'xyz' })).toThrow();
    expect(runValidation(updateClientValidation, { gender: '' })).toHaveBeenCalledOnce();
  });

  it('allows only letters in the emergency contact name, or an empty value to clear it', () => {
    expect(() => runValidation(createClientValidation, { ...validClient, emergencyContactName: 'Ana 123' })).toThrow();
    expect(() => runValidation(updateOwnClientValidation, { emergencyContactName: 'Ana_Pérez' })).toThrow();
    expect(runValidation(updateOwnClientValidation, { emergencyContactName: '' })).toHaveBeenCalledOnce();
    expect(runValidation(updateOwnClientValidation, { emergencyContactName: 'Rosa Núñez' })).toHaveBeenCalledOnce();
  });

  it('rejects invalid phone values when an existing client is updated', () => {
    expect(() => runValidation(updateClientValidation, { phone: '+51987654321' })).toThrow();
    expect(() => runValidation(updateOwnClientValidation, { emergencyContactPhone: '1234567890' })).toThrow();
  });
});
