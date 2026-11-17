import { AuthorizationError } from "@gym/shared/errors/index.js";
import type {
  FitnessWorkoutLog,
  FitnessWorkoutLogInput,
} from "../models/fitness.model.js";
import type {
  FitnessPlan,
  FitnessPlanWithSessions,
  FitnessWorkoutSession,
} from "../models/fitness.model.js";
import { query, transaction } from "@gym/shared/database/index.js";

import type {
  FitnessProfile,
  FitnessProfileInput,
} from "../models/fitness.model.js";

interface FitnessProfileRow {
  id: string;
  client_id: string;
  fitness_level: FitnessProfile["fitnessLevel"];
  training_location: FitnessProfile["trainingLocation"];
  equipment: string[];
  days_per_week: number;
  session_minutes: number;
  preferred_goal: FitnessProfile["preferredGoal"];
  mobility_notes: string | null;
  preferred_exercise_types: FitnessProfile["preferredExerciseTypes"];
  avoided_exercise_ids: string[];
  preferred_intensity: FitnessProfile["preferredIntensity"];
  dietary_preferences: string[];
  disliked_ingredients: string[];
  food_allergies: string[];
  created_at: Date;
  updated_at: Date;
}

function mapFitnessProfile(row: FitnessProfileRow): FitnessProfile {
  return {
    id: Number(row.id),
    clientId: Number(row.client_id),
    fitnessLevel: row.fitness_level,
    trainingLocation: row.training_location,
    equipment: row.equipment,
    daysPerWeek: row.days_per_week,
    sessionMinutes: row.session_minutes,
    preferredGoal: row.preferred_goal,
    mobilityNotes: row.mobility_notes,
    preferredExerciseTypes: row.preferred_exercise_types,
    avoidedExerciseIds: row.avoided_exercise_ids,
    preferredIntensity: row.preferred_intensity,
    dietaryPreferences: row.dietary_preferences,
    dislikedIngredients: row.disliked_ingredients,
    foodAllergies: row.food_allergies,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Obtiene las preferencias de entrenamiento de un socio.
 *
 * Consulta PostgreSQL utilizando el identificador del cliente.
 * Devuelve null cuando todavía no existe un perfil fitness.
 */
export async function getFitnessProfile(
  clientId: number,
): Promise<FitnessProfile | null> {
  const result = await query<FitnessProfileRow>(
    `
    SELECT *
    FROM fitness_profiles
    WHERE client_id = $1
    `,
    [clientId],
  );

  return result.rows[0]
    ? mapFitnessProfile(result.rows[0])
    : null;
}

/**
 * Guarda o actualiza el perfil fitness del socio.
 *
 * Registra su experiencia, equipamiento, ubicación,
 * frecuencia semanal, duración y objetivo principal.
 *
 * Si ya existe un perfil, actualiza sus preferencias.
 */
export async function saveFitnessProfile(
  clientId: number,
  data: FitnessProfileInput,
): Promise<FitnessProfile> {
  const result = await query<FitnessProfileRow>(
    `
    INSERT INTO fitness_profiles (
      client_id,
      fitness_level,
      training_location,
      equipment,
      days_per_week,
      session_minutes,
      preferred_goal,
      mobility_notes,
      preferred_exercise_types,
      avoided_exercise_ids,
      preferred_intensity,
      dietary_preferences,
      disliked_ingredients,
      food_allergies
    )
    VALUES (
      $1, $2, $3, $4::jsonb, $5, $6, $7, $8,
      COALESCE($9::jsonb, '[]'::jsonb),
      COALESCE($10::jsonb, '[]'::jsonb),
      COALESCE($11, 'moderate'),
      COALESCE($12::jsonb, '[]'::jsonb),
      COALESCE($13::jsonb, '[]'::jsonb),
      COALESCE($14::jsonb, '[]'::jsonb)
    )
    ON CONFLICT (client_id)
    DO UPDATE SET
      fitness_level = EXCLUDED.fitness_level,
      training_location = EXCLUDED.training_location,
      equipment = EXCLUDED.equipment,
      days_per_week = EXCLUDED.days_per_week,
      session_minutes = EXCLUDED.session_minutes,
      preferred_goal = EXCLUDED.preferred_goal,
      mobility_notes = EXCLUDED.mobility_notes,
      preferred_exercise_types = COALESCE($9::jsonb, fitness_profiles.preferred_exercise_types),
      avoided_exercise_ids = COALESCE($10::jsonb, fitness_profiles.avoided_exercise_ids),
      preferred_intensity = COALESCE($11, fitness_profiles.preferred_intensity),
      dietary_preferences = COALESCE($12::jsonb, fitness_profiles.dietary_preferences),
      disliked_ingredients = COALESCE($13::jsonb, fitness_profiles.disliked_ingredients),
      food_allergies = COALESCE($14::jsonb, fitness_profiles.food_allergies),
      updated_at = NOW()
    RETURNING *
    `,
    [
      clientId,
      data.fitnessLevel,
      data.trainingLocation,
      JSON.stringify(data.equipment),
      data.daysPerWeek,
      data.sessionMinutes,
      data.preferredGoal,
      data.mobilityNotes ?? null,
      data.preferredExerciseTypes === undefined ? null : JSON.stringify(data.preferredExerciseTypes),
      data.avoidedExerciseIds === undefined ? null : JSON.stringify(data.avoidedExerciseIds),
      data.preferredIntensity ?? null,
      data.dietaryPreferences === undefined ? null : JSON.stringify(data.dietaryPreferences),
      data.dislikedIngredients === undefined ? null : JSON.stringify(data.dislikedIngredients),
      data.foodAllergies === undefined ? null : JSON.stringify(data.foodAllergies),
    ],
  );

  return mapFitnessProfile(result.rows[0]);
}

import { NotFoundError, ValidationError } from "@gym/shared/errors/index.js";
import { generateFitnessPlan } from "./fitness.generator.js";

interface FitnessPlanRow {
  id: string;
  client_id: string;
  profile_snapshot: FitnessProfileInput;
  name: string;
  status: FitnessPlan["status"];
  created_at: Date;
  updated_at: Date;
}

interface FitnessSessionRow {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  estimated_minutes: number;
  warmup: FitnessWorkoutSession["warmup"];
  exercises: FitnessWorkoutSession["exercises"];
  cooldown: FitnessWorkoutSession["cooldown"];
}

function mapFitnessPlan(row: FitnessPlanRow): FitnessPlan {
  return {
    id: Number(row.id),
    clientId: Number(row.client_id),
    profileSnapshot: row.profile_snapshot,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFitnessSession(
  row: FitnessSessionRow,
): FitnessWorkoutSession {
  return {
    id: Number(row.id),
    planId: Number(row.plan_id),
    dayNumber: row.day_number,
    title: row.title,
    estimatedMinutes: row.estimated_minutes,
    warmup: row.warmup,
    exercises: row.exercises,
    cooldown: row.cooldown,
  };
}

/**
 * Genera y almacena un plan de entrenamiento personalizado.
 *
 * Recupera el perfil fitness, genera las sesiones semanales
 * y guarda el plan junto con sus ejercicios.
 *
 * Utiliza una transacción para evitar planes incompletos.
 * Requiere evaluación previa cuando hay notas de movilidad.
 */
export async function createFitnessPlan(
  clientId: number,
): Promise<FitnessPlanWithSessions> {
  const profile = await getFitnessProfile(clientId);

  if (!profile) {
    throw new NotFoundError("Fitness profile", clientId);
  }

  if (profile.mobilityNotes?.trim()) {
    throw new ValidationError(
      "Las limitaciones de movilidad requieren una evaluación antes de generar una rutina automática.",
    );
  }

  const profileInput: FitnessProfileInput = {
    fitnessLevel: profile.fitnessLevel,
    trainingLocation: profile.trainingLocation,
    equipment: profile.equipment,
    daysPerWeek: profile.daysPerWeek,
    sessionMinutes: profile.sessionMinutes,
    preferredGoal: profile.preferredGoal,
    mobilityNotes: profile.mobilityNotes,
    preferredExerciseTypes: profile.preferredExerciseTypes,
    avoidedExerciseIds: profile.avoidedExerciseIds,
    preferredIntensity: profile.preferredIntensity,
    dietaryPreferences: profile.dietaryPreferences,
    dislikedIngredients: profile.dislikedIngredients,
    foodAllergies: profile.foodAllergies,
  };

  const generated = generateFitnessPlan(profileInput);

  return transaction(async (client) => {
    // Serializar la generación de planes para un mismo cliente.
    // El bloqueo termina al confirmar o revertir la transacción.
    const ownershipResult = await client.query(
      `
      SELECT id
      FROM clients
      WHERE id = $1
      FOR UPDATE
      `,
      [clientId],
    );

    if (ownershipResult.rowCount !== 1) {
      throw new NotFoundError("Client", clientId);
    }

    // Conservar los planes anteriores como historial.
    await client.query(
      `
      UPDATE fitness_plans
      SET status = 'archived',
          updated_at = NOW()
      WHERE client_id = $1
        AND status = 'active'
      `,
      [clientId],
    );

    const planResult = await client.query<FitnessPlanRow>(
      `
      INSERT INTO fitness_plans (
        client_id,
        profile_snapshot,
        name,
        status
      )
      VALUES ($1, $2::jsonb, $3, 'active')
      RETURNING *
      `,
      [
        clientId,
        JSON.stringify(profileInput),
        generated.name,
      ],
    );

    const plan = mapFitnessPlan(planResult.rows[0]);
    const sessions: FitnessWorkoutSession[] = [];

    for (const session of generated.sessions) {
      const sessionResult = await client.query<FitnessSessionRow>(
        `
        INSERT INTO fitness_workout_sessions (
          plan_id,
          day_number,
          title,
          estimated_minutes,
          warmup,
          exercises,
          cooldown
        )
        VALUES (
          $1, $2, $3, $4,
          $5::jsonb, $6::jsonb, $7::jsonb
        )
        RETURNING *
        `,
        [
          plan.id,
          session.dayNumber,
          session.title,
          session.estimatedMinutes,
          JSON.stringify(session.warmup),
          JSON.stringify(session.exercises),
          JSON.stringify(session.cooldown),
        ],
      );

      sessions.push(mapFitnessSession(sessionResult.rows[0]));
    }

    return {
      ...plan,
      sessions,
    };
  });
}

/**
 * Obtiene todos los planes de entrenamiento del socio.
 *
 * Filtra los registros por cliente y devuelve
 * los planes ordenados desde el más reciente.
 */
export async function getFitnessPlans(
  clientId: number,
): Promise<FitnessPlan[]> {
  const result = await query<FitnessPlanRow>(
    `
    SELECT *
    FROM fitness_plans
    WHERE client_id = $1
    ORDER BY created_at DESC, id DESC
    `,
    [clientId],
  );

  return result.rows.map(mapFitnessPlan);
}

/**
 * Recupera un plan y sus sesiones de entrenamiento.
 *
 * Verifica que el plan pertenezca al socio solicitado
 * antes de devolver los ejercicios correspondientes.
 */
export async function getFitnessPlanById(
  clientId: number,
  planId: number,
): Promise<FitnessPlanWithSessions> {
  const planResult = await query<FitnessPlanRow>(
    `
    SELECT *
    FROM fitness_plans
    WHERE id = $1 AND client_id = $2
    `,
    [planId, clientId],
  );

  if (!planResult.rows[0]) {
    throw new NotFoundError("Fitness plan", planId);
  }

  const sessionsResult = await query<FitnessSessionRow>(
    `
    SELECT *
    FROM fitness_workout_sessions
    WHERE plan_id = $1
    ORDER BY day_number ASC
    `,
    [planId],
  );

  return {
    ...mapFitnessPlan(planResult.rows[0]),
    sessions: sessionsResult.rows.map(mapFitnessSession),
  };
}



interface FitnessWorkoutLogRow {
  id: string;
  session_id: string;
  client_id: string;
  completed_at: Date;
  duration_minutes: number | null;
  perceived_effort: number | null;
  notes: string | null;
}

function mapFitnessWorkoutLog(
  row: FitnessWorkoutLogRow,
): FitnessWorkoutLog {
  return {
    id: Number(row.id),
    sessionId: Number(row.session_id),
    clientId: Number(row.client_id),
    completedAt: row.completed_at,
    durationMinutes: row.duration_minutes ?? undefined,
    perceivedEffort: row.perceived_effort ?? undefined,
    notes: row.notes ?? undefined,
  };
}

/**
 * Registra la realización de una sesión de entrenamiento.
 *
 * Comprueba que la sesión pertenezca al socio y que
 * el plan esté activo antes de guardar el registro.
 *
 * Permite registrar duración, esfuerzo y observaciones.
 */
export async function completeFitnessWorkout(
  clientId: number,
  sessionId: number,
  data: FitnessWorkoutLogInput,
): Promise<FitnessWorkoutLog> {
  const result = await query<FitnessWorkoutLogRow>(
    `
    INSERT INTO fitness_workout_logs (
      session_id,
      client_id,
      duration_minutes,
      perceived_effort,
      notes
    )
    SELECT
      s.id,
      p.client_id,
      $3,
      $4,
      $5
    FROM fitness_workout_sessions s
    INNER JOIN fitness_plans p ON p.id = s.plan_id
    WHERE s.id = $1
      AND p.client_id = $2
      AND p.status = 'active'
    RETURNING *
    `,
    [
      sessionId,
      clientId,
      data.durationMinutes ?? null,
      data.perceivedEffort ?? null,
      data.notes ?? null,
    ],
  );

  if (!result.rows[0]) {
    throw new NotFoundError(
      "Active fitness workout session",
      sessionId,
    );
  }

  return mapFitnessWorkoutLog(result.rows[0]);
}

/**
 * Consulta el historial de entrenamientos completados.
 *
 * Recupera únicamente los registros del socio
 * y los ordena desde el entrenamiento más reciente.
 */
export async function getFitnessWorkoutHistory(
  clientId: number,
): Promise<FitnessWorkoutLog[]> {
  const result = await query<FitnessWorkoutLogRow>(
    `
    SELECT l.*
    FROM fitness_workout_logs l
    INNER JOIN fitness_workout_sessions s
      ON s.id = l.session_id
    INNER JOIN fitness_plans p
      ON p.id = s.plan_id
    WHERE l.client_id = $1
      AND p.client_id = $1
    ORDER BY l.completed_at DESC, l.id DESC
    `,
    [clientId],
  );

  return result.rows.map(mapFitnessWorkoutLog);
}


/**
 * Comprueba que el cliente tenga una membresia vigente.
 * Requiere estado activo y fechas que incluyan el dia actual.
 */
export async function requireActiveFitnessMembership(
  clientId: number,
): Promise<void> {
  const result = await query<{ has_membership: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM client_memberships
      WHERE client_id = $1
        AND status = 'active'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
    ) AS has_membership
    `,
    [clientId],
  );

  if (!result.rows[0]?.has_membership) {
    throw new AuthorizationError(
      "Necesitas una membresia vigente para utilizar el recomendador fitness",
      "ACTIVE_MEMBERSHIP_REQUIRED",
    );
  }
}
