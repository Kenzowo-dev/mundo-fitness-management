import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createValidationSchema,
  paginationSchema,
  idParamSchema,
  dateRangeSchema,
} from '../utils/validation.js';
import { z } from 'zod';

describe('Shared Module - Utilidades de Validación con Zod', () => {
  it('paginationSchema debe aplicar defaults y convertir strings a números', () => {
    const parsedDefault = paginationSchema.parse({});
    assert.equal(parsedDefault.page, 1);
    assert.equal(parsedDefault.limit, 20);
    assert.equal(parsedDefault.sortOrder, 'asc');

    const parsedCustom = paginationSchema.parse({ page: '3', limit: '50', sortOrder: 'desc' });
    assert.equal(parsedCustom.page, 3);
    assert.equal(parsedCustom.limit, 50);
    assert.equal(parsedCustom.sortOrder, 'desc');
  });

  it('paginationSchema debe rechazar límites superiores a 100 o negativos', () => {
    assert.throws(() => paginationSchema.parse({ limit: 150 }));
    assert.throws(() => paginationSchema.parse({ page: -1 }));
  });

  it('idParamSchema debe coercionar string numérico a entero positivo', () => {
    const valid = idParamSchema.parse({ id: '123' });
    assert.equal(valid.id, 123);

    assert.throws(() => idParamSchema.parse({ id: 'abc' }));
    assert.throws(() => idParamSchema.parse({ id: '-5' }));
  });

  it('dateRangeSchema debe convertir strings ISO a objetos Date', () => {
    const dates = dateRangeSchema.parse({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });
    assert.ok(dates.startDate instanceof Date);
    assert.ok(dates.endDate instanceof Date);
  });

  it('createValidationSchema debe arrojar excepción formateada en fallo', () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });
    const validator = createValidationSchema(schema);

    assert.throws(() => {
      validator({ email: 'no-email', age: 15 });
    }, /email.*age/);
  });
});
