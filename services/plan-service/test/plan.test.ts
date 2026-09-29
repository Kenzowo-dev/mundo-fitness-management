import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapRowToExercise,
  mapRowToPlan,
  mapRowToPlanDay,
  mapRowToPlanExercise,
  mapRowToClientPlan,
  mapRowToWorkoutLog,
  mapRowToLoggedExercise,
  type ExerciseRow,
  type WorkoutPlanRow,
  type PlanDayRow,
  type PlanExerciseRow,
  type ClientPlanRow,
  type WorkoutLogRow,
  type LoggedExerciseRow,
} from '../src/services/plan.service.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseExerciseRow: ExerciseRow = {
  id: 1,
  name: 'Press de banca',
  description: 'Ejercicio compuesto para pecho',
  muscle_group: 'chest',
  secondary_muscles: ['triceps', 'front_deltoid'],
  equipment: 'barbell',
  difficulty: 'intermediate',
  instructions: 'Acostarse en banco, bajar la barra al pecho y empujar.',
  video_url: 'https://cdn.mundofitness.com/press-banca.mp4',
  image_url: null,
  is_active: true,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

const basePlanRow: WorkoutPlanRow = {
  id: 10,
  name: 'Programa Fuerza 12 Semanas',
  description: 'Plan de hipertrofia muscular progresiva',
  goal: 'strength',
  difficulty: 'intermediate',
  duration_weeks: 12,
  days_per_week: 4,
  is_public: true,
  created_by: 7,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

const basePlanDayRow: PlanDayRow = {
  id: 20,
  plan_id: 10,
  day_number: 1,
  name: 'Día A - Empuje',
  focus: 'chest, shoulders, triceps',
  notes: 'Comenzar con calentamiento de 10 minutos',
  created_at: new Date('2024-01-01'),
};

const basePlanExerciseRow: PlanExerciseRow = {
  id: 30,
  plan_day_id: 20,
  exercise_id: 1,
  order_index: 1,
  sets: 4,
  reps: '6-8',
  rest_seconds: 180,
  weight_percentage: '80.00',
  notes: 'RPE 8-9',
  created_at: new Date('2024-01-01'),
};

const baseClientPlanRow: ClientPlanRow = {
  id: 40,
  client_id: 1,
  plan_id: 10,
  assigned_by: 7,
  start_date: new Date('2024-06-01'),
  end_date: new Date('2024-08-24'),
  status: 'active',
  current_week: 1,
  current_day: 1,
  notes: 'Primer plan del cliente',
  created_at: new Date('2024-06-01'),
  updated_at: new Date('2024-06-01'),
};

const baseWorkoutLogRow: WorkoutLogRow = {
  id: 50,
  client_plan_id: 40,
  client_id: 1,
  plan_day_id: 20,
  completed_at: new Date('2024-06-03T17:00:00Z'),
  duration_minutes: 75,
  notes: 'Muy buena sesión, superé el peso de la semana pasada',
  rating: 5,
};

const baseLoggedExerciseRow: LoggedExerciseRow = {
  id: 60,
  workout_log_id: 50,
  plan_exercise_id: 30,
  exercise_id: 1,
  sets_completed: 4,
  reps_completed: [8, 8, 7, 6],
  weights_used: [80, 80, 85, 85],
  rpe: '8.5',
  notes: 'Último set al fallo',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Plan Service - mapRowToExercise', () => {
  it('debe mapear correctamente un ejercicio completo', () => {
    const exercise = mapRowToExercise(baseExerciseRow);

    assert.equal(exercise.id, 1);
    assert.equal(exercise.name, 'Press de banca');
    assert.equal(exercise.muscleGroup, 'chest');
    assert.equal(exercise.difficulty, 'intermediate');
    assert.equal(exercise.equipment, 'barbell');
    assert.equal(exercise.isActive, true);
    assert.ok(exercise.createdAt instanceof Date);
  });

  it('debe mapear secondary_muscles como array', () => {
    const exercise = mapRowToExercise(baseExerciseRow);

    assert.ok(Array.isArray(exercise.secondaryMuscles));
    assert.ok(exercise.secondaryMuscles.includes('triceps'));
  });

  it('debe devolver array vacío si secondary_muscles es null', () => {
    const row: ExerciseRow = { ...baseExerciseRow, secondary_muscles: null };
    const exercise = mapRowToExercise(row);

    assert.deepEqual(exercise.secondaryMuscles, []);
  });

  it('debe convertir image_url null a undefined', () => {
    const exercise = mapRowToExercise(baseExerciseRow);
    assert.equal(exercise.imageUrl, undefined);
  });
});

describe('Plan Service - mapRowToPlan', () => {
  it('debe mapear correctamente un plan de entrenamiento', () => {
    const plan = mapRowToPlan(basePlanRow);

    assert.equal(plan.id, 10);
    assert.equal(plan.name, 'Programa Fuerza 12 Semanas');
    assert.equal(plan.goal, 'strength');
    assert.equal(plan.difficulty, 'intermediate');
    assert.equal(plan.durationWeeks, 12);
    assert.equal(plan.daysPerWeek, 4);
    assert.equal(plan.isPublic, true);
    assert.equal(plan.createdBy, 7);
    assert.ok(plan.createdAt instanceof Date);
  });

  it('debe mapear created_by null como undefined', () => {
    const row: WorkoutPlanRow = { ...basePlanRow, created_by: null };
    const plan = mapRowToPlan(row);

    assert.equal(plan.createdBy, undefined);
  });
});

describe('Plan Service - mapRowToPlanDay', () => {
  it('debe mapear correctamente un día de plan', () => {
    const day = mapRowToPlanDay(basePlanDayRow);

    assert.equal(day.id, 20);
    assert.equal(day.planId, 10);
    assert.equal(day.dayNumber, 1);
    assert.equal(day.name, 'Día A - Empuje');
    assert.equal(day.focus, 'chest, shoulders, triceps');
    assert.equal(day.notes, 'Comenzar con calentamiento de 10 minutos');
    assert.ok(day.createdAt instanceof Date);
  });

  it('debe convertir focus y notes null a undefined', () => {
    const row: PlanDayRow = { ...basePlanDayRow, focus: null, notes: null };
    const day = mapRowToPlanDay(row);

    assert.equal(day.focus, undefined);
    assert.equal(day.notes, undefined);
  });
});

describe('Plan Service - mapRowToPlanExercise', () => {
  it('debe mapear correctamente un ejercicio de plan', () => {
    const pe = mapRowToPlanExercise(basePlanExerciseRow);

    assert.equal(pe.id, 30);
    assert.equal(pe.planDayId, 20);
    assert.equal(pe.exerciseId, 1);
    assert.equal(pe.orderIndex, 1);
    assert.equal(pe.sets, 4);
    assert.equal(pe.reps, '6-8');
    assert.equal(pe.restSeconds, 180);
    assert.ok(Math.abs((pe.weightPercentage as number) - 80.0) < 0.001);
  });

  it('debe convertir weight_percentage null a undefined', () => {
    const row: PlanExerciseRow = { ...basePlanExerciseRow, weight_percentage: null };
    const pe = mapRowToPlanExercise(row);

    assert.equal(pe.weightPercentage, undefined);
  });
});

describe('Plan Service - mapRowToClientPlan', () => {
  it('debe mapear correctamente un plan asignado a un cliente', () => {
    const cp = mapRowToClientPlan(baseClientPlanRow);

    assert.equal(cp.id, 40);
    assert.equal(cp.clientId, 1);
    assert.equal(cp.planId, 10);
    assert.equal(cp.assignedBy, 7);
    assert.equal(cp.status, 'active');
    assert.equal(cp.currentWeek, 1);
    assert.equal(cp.currentDay, 1);
    assert.ok(cp.startDate instanceof Date);
    assert.ok(cp.endDate instanceof Date);
  });

  it('debe convertir end_date null a undefined', () => {
    const row: ClientPlanRow = { ...baseClientPlanRow, end_date: null };
    const cp = mapRowToClientPlan(row);

    assert.equal(cp.endDate, undefined);
  });
});

describe('Plan Service - mapRowToWorkoutLog', () => {
  it('debe mapear correctamente un log de entrenamiento', () => {
    const log = mapRowToWorkoutLog(baseWorkoutLogRow);

    assert.equal(log.id, 50);
    assert.equal(log.clientPlanId, 40);
    assert.equal(log.clientId, 1);
    assert.equal(log.planDayId, 20);
    assert.equal(log.durationMinutes, 75);
    assert.equal(log.rating, 5);
    assert.ok(log.completedAt instanceof Date);
  });

  it('debe convertir campos opcionales null a undefined', () => {
    const row: WorkoutLogRow = {
      ...baseWorkoutLogRow,
      duration_minutes: null,
      notes: null,
      rating: null,
    };
    const log = mapRowToWorkoutLog(row);

    assert.equal(log.durationMinutes, undefined);
    assert.equal(log.notes, undefined);
    assert.equal(log.rating, undefined);
  });
});

describe('Plan Service - mapRowToLoggedExercise', () => {
  it('debe mapear correctamente un ejercicio registrado en el log', () => {
    const le = mapRowToLoggedExercise(baseLoggedExerciseRow);

    assert.equal(le.id, 60);
    assert.equal(le.workoutLogId, 50);
    assert.equal(le.exerciseId, 1);
    assert.equal(le.setsCompleted, 4);
    assert.deepEqual(le.repsCompleted, [8, 8, 7, 6]);
    assert.deepEqual(le.weightsUsed, [80, 80, 85, 85]);
    assert.ok(Math.abs((le.rpe as number) - 8.5) < 0.001);
  });

  it('debe devolver arrays vacíos si reps_completed y weights_used son null', () => {
    const row: LoggedExerciseRow = {
      ...baseLoggedExerciseRow,
      reps_completed: null,
      weights_used: null,
      rpe: null,
    };
    const le = mapRowToLoggedExercise(row);

    assert.deepEqual(le.repsCompleted, []);
    assert.deepEqual(le.weightsUsed, []);
    assert.equal(le.rpe, undefined);
  });
});

describe('Plan Service - Lógica de progresión de plan', () => {
  it('debe avanzar al siguiente día correctamente', () => {
    // Simula la lógica de logWorkout para actualizar current_week/current_day
    const currentDay = 1;
    const daysPerWeek = 4;
    const currentWeek = 1;

    const nextDay = currentDay + 1;
    const nextWeek = nextDay > daysPerWeek ? currentWeek + 1 : currentWeek;
    const finalDay = nextDay > daysPerWeek ? 1 : nextDay;

    assert.equal(finalDay, 2);
    assert.equal(nextWeek, 1);
  });

  it('debe reiniciar al día 1 y avanzar semana al completar todos los días', () => {
    const currentDay = 4; // último día de la semana
    const daysPerWeek = 4;
    const currentWeek = 1;

    const nextDay = currentDay + 1;
    const nextWeek = nextDay > daysPerWeek ? currentWeek + 1 : currentWeek;
    const finalDay = nextDay > daysPerWeek ? 1 : nextDay;

    assert.equal(finalDay, 1);
    assert.equal(nextWeek, 2);
  });

  it('debe calcular endDate correctamente para plan de 12 semanas', () => {
    const startDate = new Date('2024-06-01');
    const durationWeeks = 12;
    const endDate = new Date(startDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);

    const diffWeeks = (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000);
    assert.equal(diffWeeks, 12);
  });
});
