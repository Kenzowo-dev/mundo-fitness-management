import { describe, expect, it, vi } from 'vitest';
import { createPlanValidation, updatePlanValidation } from '../src/controllers/membership.controller.js';

const basePlan = { durationDays: 30, price: 99.9, currency: 'PEN' };

function run(validation: (req: never, res: never, next: () => void) => void, body: Record<string, unknown>) {
  const next = vi.fn();
  validation({ body } as never, {} as never, next);
  return next;
}

describe('plan name validation', () => {
  it.each(['Plan Anual Élite', 'Plan Premium+', 'Plan 2.0 - Estudiantes'])('accepts "%s"', (name) => {
    expect(run(createPlanValidation, { ...basePlan, name })).toHaveBeenCalledOnce();
  });

  it.each(['Plan $$$', '<script>', '+Plan', 'Plan @VIP'])('rejects "%s"', (name) => {
    expect(() => run(createPlanValidation, { ...basePlan, name })).toThrow(/name:/);
    expect(() => run(updatePlanValidation, { name })).toThrow(/name:/);
  });
});
