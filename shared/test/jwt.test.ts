import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
} from '../utils/jwt.js';

describe('Shared Module - JWT Utilities', () => {
  const dummyUser = {
    sub: '1001',
    email: 'test@mundofitness.com',
    role: 'receptionist',
    permissions: ['clients:read', 'plans:write'],
  };

  it('debe generar y verificar un access token válido correctamente', () => {
    const token = generateAccessToken(dummyUser);
    assert.ok(typeof token === 'string', 'El token debe ser un string');

    const decoded = verifyAccessToken(token);
    assert.equal(decoded.sub, dummyUser.sub);
    assert.equal(decoded.email, dummyUser.email);
    assert.equal(decoded.role, dummyUser.role);
    assert.deepEqual(decoded.permissions, dummyUser.permissions);
    assert.equal(decoded.iss, 'gym-system');
    assert.equal(decoded.aud, 'gym-api');
  });

  it('debe generar y verificar un refresh token válido', () => {
    const refreshToken = generateRefreshToken('1001');
    assert.ok(typeof refreshToken === 'string', 'El refresh token debe ser un string');

    const decoded = verifyRefreshToken(refreshToken);
    assert.equal(decoded.sub, '1001');
    assert.equal(decoded.type, 'refresh');
  });

  it('debe generar refresh tokens distintos en emisiones simultáneas', () => {
    const first = generateRefreshToken('1001');
    const second = generateRefreshToken('1001');
    assert.notEqual(first, second);
    assert.ok(verifyRefreshToken(first).jti);
    assert.ok(verifyRefreshToken(second).jti);
  });

  it('debe fallar al verificar un token alterado o malformado', () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
    assert.throws(() => {
      verifyAccessToken(invalidToken);
    });
  });

  it('debe extraer correctamente el token del encabezado Authorization Bearer', () => {
    const header = 'Bearer abcdef123456';
    const extracted = extractTokenFromHeader(header);
    assert.equal(extracted, 'abcdef123456');

    assert.equal(extractTokenFromHeader(undefined), null);
    assert.equal(extractTokenFromHeader('Basic xyz'), null);
    assert.equal(extractTokenFromHeader('Bearer'), null);
  });
});
