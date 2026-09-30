import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../errors/index.js';

describe('Shared Module - Clases de Error Estandarizadas', () => {
  it('AppError debe asignar correctamente status, código y mensaje', () => {
    const error = new AppError('Error genérico', 500, 'INTERNAL_ERROR');
    assert.equal(error.message, 'Error genérico');
    assert.equal(error.statusCode, 500);
    assert.equal(error.code, 'INTERNAL_ERROR');
    assert.equal(error.isOperational, true);
    assert.ok(error instanceof Error);
    assert.ok(error instanceof AppError);
  });

  it('ValidationError debe tener status 400 y código VALIDATION_ERROR', () => {
    const error = new ValidationError('Datos inválidos', { field: 'email' });
    assert.equal(error.statusCode, 400);
    assert.equal(error.code, 'VALIDATION_ERROR');
    assert.deepEqual(error.details, { field: 'email' });
    assert.ok(error instanceof AppError);
    assert.ok(error instanceof ValidationError);
  });

  it('AuthenticationError debe tener status 401 y código AUTHENTICATION_ERROR', () => {
    const error = new AuthenticationError('Token requerido', 'TOKEN_MISSING');
    assert.equal(error.statusCode, 401);
    assert.equal(error.code, 'TOKEN_MISSING');
    assert.ok(error instanceof AppError);
    assert.ok(error instanceof AuthenticationError);
  });

  it('AuthorizationError debe tener status 403 y código FORBIDDEN', () => {
    const error = new AuthorizationError('Acceso denegado');
    assert.equal(error.statusCode, 403);
    assert.equal(error.code, 'FORBIDDEN');
    assert.ok(error instanceof AppError);
    assert.ok(error instanceof AuthorizationError);
  });

  it('NotFoundError debe formatear el mensaje con el recurso e ID', () => {
    const error = new NotFoundError('Client', 42);
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, 'NOT_FOUND');
    assert.equal(error.message, 'Client with identifier "42" not found');
    assert.ok(error instanceof NotFoundError);
  });

  it('ConflictError debe tener status 409 y código CONFLICT', () => {
    const error = new ConflictError('DNI ya registrado');
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, 'CONFLICT');
    assert.ok(error instanceof ConflictError);
  });
});
