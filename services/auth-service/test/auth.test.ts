import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

describe('Auth Service - Validación y Seguridad de Autenticación', () => {
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().max(20).optional(),
    role: z.enum(['member', 'trainer', 'receptionist']).optional(),
  });

  it('debe validar exitosamente un payload de registro válido', () => {
    const validData = {
      email: 'nuevo.socio@mundofitness.com',
      password: 'PasswordSeguro123!',
      firstName: 'Mateo',
      lastName: 'Gómez',
      role: 'member',
    };
    const parsed = registerSchema.parse(validData);
    assert.equal(parsed.email, validData.email);
    assert.equal(parsed.role, 'member');
  });

  it('debe rechazar registro con contraseña menor a 8 caracteres', () => {
    const invalidData = {
      email: 'socio@mundofitness.com',
      password: '123',
      firstName: 'Mateo',
      lastName: 'Gómez',
    };
    assert.throws(() => registerSchema.parse(invalidData));
  });

  it('debe generar y verificar hash de contraseña con bcrypt (costo 12)', async () => {
    const password = 'ClaveUltraSegura2026!';
    const hash = await bcrypt.hash(password, 12);

    assert.ok(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'));
    const isMatch = await bcrypt.compare(password, hash);
    assert.equal(isMatch, true);

    const isWrongMatch = await bcrypt.compare('ClaveIncorrecta', hash);
    assert.equal(isWrongMatch, false);
  });
});
