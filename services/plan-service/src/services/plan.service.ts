import { query, transaction } from '@gym/shared/database/index.js';
import {
  Exercise,
  CreateExerciseData,
  WorkoutPlan,
  CreatePlanData,
  PlanDay,
  PlanExercise,
  ClientPlan,
  AssignPlanData,
  WorkoutLog,
  LogWorkoutData,
  LoggedExercise,
} from '../models/plan.js';
import {
  NotFoundError,
  ConflictError,
} from '@gym/shared/errors/index.js';

export interface ExerciseRow {
  id: number;
  name: string;
  description: string | null;
  muscle_group: string;
  secondary_muscles: string[] | null;
  equipment: string | null;
  difficulty: string;
  instructions: string | null;
  video_url: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WorkoutPlanRow {
  id: number;
  name: string;
  description: string | null;
  goal: string;
  difficulty: string;
  duration_weeks: number;
  days_per_week: number;
  is_public: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlanDayRow {
  id: number;
  plan_id: number;
  day_number: number;
  name: string;
  focus: string | null;
  notes: string | null;
  created_at: Date;
}

export interface PlanExerciseRow {
  id: number;
  plan_day_id: number;
  exercise_id: number;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  weight_percentage: string | number | null;
  notes: string | null;
  created_at: Date;
}

export interface ClientPlanRow {
  id: number;
  client_id: number;
  plan_id: number;
  assigned_by: number | null;
  start_date: Date;
  end_date: Date | null;
  status: string;
  current_week: number;
  current_day: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WorkoutLogRow {
  id: number;
  client_plan_id: number;
  client_id: number;
  plan_day_id: number;
  completed_at: Date;
  duration_minutes: number | null;
  notes: string | null;
  rating: number | null;
}

export interface LoggedExerciseRow {
  id: number;
  workout_log_id: number;
  plan_exercise_id: number;
  exercise_id: number;
  sets_completed: number;
  reps_completed: number[] | null;
  weights_used: number[] | null;
  rpe: string | number | null;
  notes: string | null;
}

export function mapRowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    muscleGroup: row.muscle_group,
    secondaryMuscles: row.secondary_muscles || [],
    equipment: row.equipment ?? undefined,
    difficulty: row.difficulty,
    instructions: row.instructions ?? undefined,
    videoUrl: row.video_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToPlan(row: WorkoutPlanRow): WorkoutPlan {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    goal: row.goal,
    difficulty: row.difficulty,
    durationWeeks: row.duration_weeks,
    daysPerWeek: row.days_per_week,
    isPublic: Boolean(row.is_public),
    createdBy: row.created_by ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToPlanDay(row: PlanDayRow): PlanDay {
  return {
    id: row.id,
    planId: row.plan_id,
    dayNumber: row.day_number,
    name: row.name,
    focus: row.focus ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export function mapRowToPlanExercise(row: PlanExerciseRow): PlanExercise {
  return {
    id: row.id,
    planDayId: row.plan_day_id,
    exerciseId: row.exercise_id,
    orderIndex: row.order_index,
    sets: row.sets,
    reps: row.reps,
    restSeconds: row.rest_seconds,
    weightPercentage: row.weight_percentage != null ? (typeof row.weight_percentage === 'number' ? row.weight_percentage : parseFloat(row.weight_percentage)) : undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export function mapRowToClientPlan(row: ClientPlanRow): ClientPlan {
  return {
    id: row.id,
    clientId: row.client_id,
    planId: row.plan_id,
    assignedBy: row.assigned_by ?? undefined,
    startDate: new Date(row.start_date),
    endDate: row.end_date ? new Date(row.end_date) : undefined,
    status: row.status,
    currentWeek: row.current_week,
    currentDay: row.current_day,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToWorkoutLog(row: WorkoutLogRow): WorkoutLog {
  return {
    id: row.id,
    clientPlanId: row.client_plan_id,
    clientId: row.client_id,
    planDayId: row.plan_day_id,
    completedAt: new Date(row.completed_at),
    durationMinutes: row.duration_minutes ?? undefined,
    notes: row.notes ?? undefined,
    rating: row.rating ?? undefined,
  };
}

export function mapRowToLoggedExercise(row: LoggedExerciseRow): LoggedExercise {
  return {
    id: row.id,
    workoutLogId: row.workout_log_id,
    planExerciseId: row.plan_exercise_id,
    exerciseId: row.exercise_id,
    setsCompleted: row.sets_completed,
    repsCompleted: row.reps_completed || [],
    weightsUsed: row.weights_used || [],
    rpe: row.rpe != null ? (typeof row.rpe === 'number' ? row.rpe : parseFloat(row.rpe)) : undefined,
    notes: row.notes ?? undefined,
  };
}

export async function createExercise(data: CreateExerciseData): Promise<Exercise> {
  const result = await query<ExerciseRow>(
    `
    INSERT INTO exercises (name, description, muscle_group, secondary_muscles, equipment, difficulty, instructions, video_url, image_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [
      data.name,
      data.description ?? null,
      data.muscleGroup,
      data.secondaryMuscles ?? null,
      data.equipment ?? null,
      data.difficulty ?? 'beginner',
      data.instructions ?? null,
      data.videoUrl ?? null,
      data.imageUrl ?? null,
    ]
  );
  return mapRowToExercise(result.rows[0]);
}

export async function getExerciseById(id: number): Promise<Exercise | null> {
  const result = await query<ExerciseRow>('SELECT * FROM exercises WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapRowToExercise(result.rows[0]) : null;
}

export async function listExercises(
  muscleGroup?: string,
  difficulty?: string,
  activeOnly = true
): Promise<Exercise[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (activeOnly) {
    conditions.push(`is_active = true`);
  }
  if (muscleGroup) {
    conditions.push(`muscle_group = $${values.length + 1}`);
    values.push(muscleGroup);
  }
  if (difficulty) {
    conditions.push(`difficulty = $${values.length + 1}`);
    values.push(difficulty);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<ExerciseRow>(`SELECT * FROM exercises ${whereClause} ORDER BY muscle_group, name`, values);
  return result.rows.map(mapRowToExercise);
}

export async function updateExercise(id: number, data: Partial<CreateExerciseData>): Promise<Exercise> {
  const existing = await getExerciseById(id);
  if (!existing) throw new NotFoundError('Exercise', id);

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    muscleGroup: 'muscle_group',
    secondaryMuscles: 'secondary_muscles',
    equipment: 'equipment',
    difficulty: 'difficulty',
    instructions: 'instructions',
    videoUrl: 'video_url',
    imageUrl: 'image_url',
    isActive: 'is_active',
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    const value = data[key as keyof CreateExerciseData];
    if (value !== undefined) {
      fields.push(`${dbField} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return existing;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<ExerciseRow>(
    `UPDATE exercises SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return mapRowToExercise(result.rows[0]);
}

export async function createPlan(data: CreatePlanData): Promise<WorkoutPlan> {
  return await transaction(async (client) => {
    const planResult = await client.query(
      `INSERT INTO workout_plans (name, description, goal, difficulty, duration_weeks, days_per_week, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        data.name,
        data.description ?? null,
        data.goal ?? null,
        data.difficulty ?? 'beginner',
        data.durationWeeks ?? null,
        data.daysPerWeek ?? null,
        data.isPublic ?? false,
        data.createdBy ?? null,
      ]
    );

    const plan = mapRowToPlan(planResult.rows[0]);

    for (const dayData of data.days) {
      const dayResult = await client.query(
        `INSERT INTO plan_days (plan_id, day_number, name, focus, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [plan.id, dayData.dayNumber, dayData.name ?? null, dayData.focus ?? null, dayData.notes ?? null]
      );

      const day = mapRowToPlanDay(dayResult.rows[0]);

      for (const exerciseData of dayData.exercises) {
        await client.query(
          `INSERT INTO plan_exercises (plan_day_id, exercise_id, order_index, sets, reps, rest_seconds, weight_percentage, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            day.id,
            exerciseData.exerciseId,
            exerciseData.orderIndex ?? 0,
            exerciseData.sets ?? 3,
            exerciseData.reps ?? '8-12',
            exerciseData.restSeconds ?? 90,
            exerciseData.weightPercentage ?? null,
            exerciseData.notes ?? null,
          ]
        );
      }
    }

    return plan;
  });
}

export async function getPlanById(id: number, includeDays = false): Promise<WorkoutPlan | null> {
  const planResult = await query<WorkoutPlanRow>('SELECT * FROM workout_plans WHERE id = $1', [id]);
  if (planResult.rows.length === 0) return null;

  const plan = mapRowToPlan(planResult.rows[0]);

  if (includeDays) {
    const daysResult = await query<PlanDayRow>('SELECT * FROM plan_days WHERE plan_id = $1 ORDER BY day_number', [id]);
    plan.days = daysResult.rows.map(mapRowToPlanDay);

    for (const day of plan.days) {
      const exercisesResult = await query<PlanExerciseRow & { name: string; muscle_group: string; equipment: string | null; difficulty: string }>(
        `SELECT pe.*, e.name, e.muscle_group, e.equipment, e.difficulty
         FROM plan_exercises pe
         JOIN exercises e ON pe.exercise_id = e.id
         WHERE pe.plan_day_id = $1
         ORDER BY pe.order_index`,
        [day.id]
      );
      day.exercises = exercisesResult.rows.map((row) => ({
        ...mapRowToPlanExercise(row),
        exercise: {
          id: row.exercise_id,
          name: row.name,
          muscleGroup: row.muscle_group,
          equipment: row.equipment ?? undefined,
          difficulty: row.difficulty,
        } as Exercise,
      }));
    }
  }

  return plan;
}

export async function listPlans(
  publicOnly = false,
  createdBy?: number
): Promise<WorkoutPlan[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (publicOnly) {
    conditions.push(`is_public = true`);
  }
  if (createdBy) {
    conditions.push(`created_by = $${values.length + 1}`);
    values.push(createdBy);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<WorkoutPlanRow>(`SELECT * FROM workout_plans ${whereClause} ORDER BY created_at DESC`, values);
  return result.rows.map(mapRowToPlan);
}

export async function updatePlan(id: number, data: Partial<CreatePlanData>): Promise<WorkoutPlan> {
  const existing = await getPlanById(id);
  if (!existing) throw new NotFoundError('WorkoutPlan', id);

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    goal: 'goal',
    difficulty: 'difficulty',
    durationWeeks: 'duration_weeks',
    daysPerWeek: 'days_per_week',
    isPublic: 'is_public',
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    const value = data[key as keyof CreatePlanData];
    if (value !== undefined) {
      fields.push(`${dbField} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length > 0) {
    fields.push(`updated_at = NOW()`);
    values.push(id);
    await query(`UPDATE workout_plans SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
  }

  const days = data.days;
  if (days && days.length > 0) {
    await transaction(async (client) => {
      await client.query('DELETE FROM plan_exercises WHERE plan_day_id IN (SELECT id FROM plan_days WHERE plan_id = $1)', [id]);
      await client.query('DELETE FROM plan_days WHERE plan_id = $1', [id]);

      for (const dayData of days) {
        const dayResult = await client.query(
          `INSERT INTO plan_days (plan_id, day_number, name, focus, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [id, dayData.dayNumber, dayData.name ?? null, dayData.focus ?? null, dayData.notes ?? null]
        );

        const day = mapRowToPlanDay(dayResult.rows[0]);

        for (const exerciseData of dayData.exercises) {
          await client.query(
            `INSERT INTO plan_exercises (plan_day_id, exercise_id, order_index, sets, reps, rest_seconds, weight_percentage, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              day.id,
              exerciseData.exerciseId,
              exerciseData.orderIndex ?? 0,
              exerciseData.sets ?? 3,
              exerciseData.reps ?? '8-12',
              exerciseData.restSeconds ?? 90,
              exerciseData.weightPercentage ?? null,
              exerciseData.notes ?? null,
            ]
          );
        }
      }
    });
  }

  return getPlanById(id, true) as Promise<WorkoutPlan>;
}

export async function deletePlan(id: number): Promise<void> {
  const result = await query('DELETE FROM workout_plans WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new NotFoundError('WorkoutPlan', id);
}

export async function assignPlanToClient(data: AssignPlanData): Promise<ClientPlan> {
  const plan = await getPlanById(data.planId);
  if (!plan) throw new NotFoundError('WorkoutPlan', data.planId);

  const activePlan = await query(
    `SELECT id FROM client_plans WHERE client_id = $1 AND status = 'active'`,
    [data.clientId]
  );
  if (activePlan.rows.length > 0) {
    throw new ConflictError('Client already has an active plan', 'ACTIVE_PLAN_EXISTS');
  }

  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const endDate = data.endDate ? new Date(data.endDate) : (plan.durationWeeks ? new Date(startDate.getTime() + plan.durationWeeks * 7 * 24 * 60 * 60 * 1000) : null);

  const result = await query<ClientPlanRow>(
    `INSERT INTO client_plans (client_id, plan_id, assigned_by, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.clientId, data.planId, data.assignedBy ?? null, startDate, endDate]
  );
  return mapRowToClientPlan(result.rows[0]);
}

export async function getClientPlans(clientId: number): Promise<ClientPlan[]> {
  const result = await query<ClientPlanRow & { name: string; description: string | null; goal: string; difficulty: string; duration_weeks: number; days_per_week: number }>(
    `SELECT cp.*, wp.name, wp.description, wp.goal, wp.difficulty, wp.duration_weeks, wp.days_per_week
     FROM client_plans cp
     JOIN workout_plans wp ON cp.plan_id = wp.id
     WHERE cp.client_id = $1
     ORDER BY cp.created_at DESC`,
    [clientId]
  );
  return result.rows.map((row) => {
    const plan = mapRowToClientPlan(row);
    plan.plan = {
      id: row.plan_id,
      name: row.name,
      description: row.description ?? undefined,
      goal: row.goal,
      difficulty: row.difficulty,
      durationWeeks: row.duration_weeks,
      daysPerWeek: row.days_per_week,
      isPublic: false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    return plan;
  });
}

export async function getActiveClientPlan(clientId: number): Promise<ClientPlan | null> {
  const result = await query<ClientPlanRow & { name: string; description: string | null; goal: string; difficulty: string; duration_weeks: number; days_per_week: number }>(
    `SELECT cp.*, wp.name, wp.description, wp.goal, wp.difficulty, wp.duration_weeks, wp.days_per_week
     FROM client_plans cp
     JOIN workout_plans wp ON cp.plan_id = wp.id
     WHERE cp.client_id = $1 AND cp.status = 'active'
     ORDER BY cp.created_at DESC
     LIMIT 1`,
    [clientId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const plan = mapRowToClientPlan(row);
  plan.plan = {
    id: row.plan_id,
    name: row.name,
    description: row.description ?? undefined,
    goal: row.goal,
    difficulty: row.difficulty,
    durationWeeks: row.duration_weeks,
    daysPerWeek: row.days_per_week,
    isPublic: false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
  return plan;
}

export async function updateClientPlanProgress(clientPlanId: number, currentWeek: number, currentDay: number): Promise<ClientPlan> {
  const result = await query<ClientPlanRow>(
    `UPDATE client_plans SET current_week = $1, current_day = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [currentWeek, currentDay, clientPlanId]
  );
  if (result.rows.length === 0) throw new NotFoundError('ClientPlan', clientPlanId);
  return mapRowToClientPlan(result.rows[0]);
}

export async function completeClientPlan(clientPlanId: number): Promise<ClientPlan> {
  const result = await query<ClientPlanRow>(
    `UPDATE client_plans SET status = 'completed', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [clientPlanId]
  );
  if (result.rows.length === 0) throw new NotFoundError('ClientPlan', clientPlanId);
  return mapRowToClientPlan(result.rows[0]);
}

export async function logWorkout(data: LogWorkoutData): Promise<WorkoutLog> {
  return await transaction(async (client) => {
    const clientPlanResult = await client.query('SELECT * FROM client_plans WHERE id = $1', [data.clientPlanId]);
    if (clientPlanResult.rows.length === 0) throw new NotFoundError('ClientPlan', data.clientPlanId);

    const logResult = await client.query(
      `INSERT INTO workout_logs (client_plan_id, client_id, plan_day_id, duration_minutes, notes, rating)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.clientPlanId, data.clientId, data.planDayId, data.durationMinutes ?? null, data.notes ?? null, data.rating ?? null]
    );

    const workoutLog = mapRowToWorkoutLog(logResult.rows[0]);

    for (const exerciseData of data.exercises) {
      await client.query(
        `INSERT INTO logged_exercises (workout_log_id, plan_exercise_id, exercise_id, sets_completed, reps_completed, weights_used, rpe, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          workoutLog.id,
          exerciseData.planExerciseId,
          exerciseData.exerciseId,
          exerciseData.setsCompleted,
          JSON.stringify(exerciseData.repsCompleted),
          JSON.stringify(exerciseData.weightsUsed),
          exerciseData.rpe ?? null,
          exerciseData.notes ?? null,
        ]
      );
    }

    const clientPlan = clientPlanResult.rows[0];
    const nextDay = clientPlan.current_day + 1;
    const nextWeek = nextDay > (clientPlan.days_per_week || 7) ? clientPlan.current_week + 1 : clientPlan.current_week;
    const finalDay = nextDay > (clientPlan.days_per_week || 7) ? 1 : nextDay;

    await client.query(
      `UPDATE client_plans SET current_week = $1, current_day = $2, updated_at = NOW() WHERE id = $3`,
      [nextWeek, finalDay, data.clientPlanId]
    );

    return workoutLog;
  });
}

export async function getWorkoutLogs(clientPlanId: number): Promise<WorkoutLog[]> {
  const result = await query<WorkoutLogRow>(
    `SELECT * FROM workout_logs WHERE client_plan_id = $1 ORDER BY completed_at DESC`,
    [clientPlanId]
  );
  return result.rows.map(mapRowToWorkoutLog);
}

export async function getWorkoutLogWithExercises(logId: number): Promise<WorkoutLog | null> {
  const logResult = await query<WorkoutLogRow>('SELECT * FROM workout_logs WHERE id = $1', [logId]);
  if (logResult.rows.length === 0) return null;

  const log = mapRowToWorkoutLog(logResult.rows[0]);
  const exercisesResult = await query<LoggedExerciseRow & { name: string; muscle_group: string }>(
    `SELECT le.*, e.name, e.muscle_group
     FROM logged_exercises le
     JOIN exercises e ON le.exercise_id = e.id
     WHERE le.workout_log_id = $1`,
    [logId]
  );
  log.exercises = exercisesResult.rows.map(mapRowToLoggedExercise);
  return log;
}