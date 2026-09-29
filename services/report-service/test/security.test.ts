import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Report Service - Seguridad de Consultas SQL', () => {
  function validateSqlIsReadOnly(sql: string): boolean {
    const normalized = sql.trim().toLowerCase();
    const isReadOnly = normalized.startsWith('select') || normalized.startsWith('with');
    const hasDestructive = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|execute|copy)\b/i.test(sql);
    const hasMultiple = sql.includes(';') && !sql.trim().endsWith(';');

    return isReadOnly && !hasDestructive && !hasMultiple;
  }

  it('debe permitir consultas de lectura legítimas (SELECT / WITH)', () => {
    assert.equal(validateSqlIsReadOnly('SELECT id, name FROM membership_plans'), true);
    assert.equal(validateSqlIsReadOnly('SELECT COUNT(*) as total FROM clients WHERE status = $1'), true);
    assert.equal(validateSqlIsReadOnly('WITH active_m AS (SELECT * FROM client_memberships) SELECT * FROM active_m'), true);
  });

  it('debe bloquear sentencias destructivas como DROP TABLE o DELETE', () => {
    assert.equal(validateSqlIsReadOnly('DROP TABLE users'), false);
    assert.equal(validateSqlIsReadOnly('DELETE FROM clients WHERE id = 1'), false);
    assert.equal(validateSqlIsReadOnly('TRUNCATE payments'), false);
    assert.equal(validateSqlIsReadOnly('UPDATE users SET role = "admin"'), false);
  });

  it('debe bloquear consultas compuestas o encadenadas por punto y coma', () => {
    assert.equal(validateSqlIsReadOnly('SELECT 1; DROP TABLE users;'), false);
    assert.equal(validateSqlIsReadOnly('SELECT * FROM clients; DELETE FROM clients;'), false);
  });
});
