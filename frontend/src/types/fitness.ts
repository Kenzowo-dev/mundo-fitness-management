/**
 * Tipos utilizados por el recomendador fitness del portal del socio.
 * Representan las respuestas JSON del microservicio de clientes.
 */

export type FitnessLevel = "beginner" | "intermediate" | "advanced";

export type TrainingLocation = "home" | "gym" | "both";

export type FitnessGoal =
  | "weight"
  | "muscle"
  | "body_fat"
  | "endurance"
  | "strength"
  | "general";

export type FitnessPlanStatus = "active" | "completed" | "archived";

/** Preferencias utilizadas para personalizar las rutinas. */
export interface FitnessProfileInput {
  fitnessLevel: FitnessLevel;
  trainingLocation: TrainingLocation;
  equipment: string[];
  daysPerWeek: number;
  sessionMinutes: number;
  preferredGoal: FitnessGoal;
  mobilityNotes?: string | null;
  preferredExerciseTypes?: ("strength" | "cardio" | "mobility")[];
  avoidedExerciseIds?: string[];
  preferredIntensity?: "light" | "moderate" | "intense";
  dietaryPreferences?: string[];
  dislikedIngredients?: string[];
  foodAllergies?: string[];
}

/** Perfil fitness almacenado para el socio autenticado. */
export interface FitnessProfile extends FitnessProfileInput {
  id: number;
  clientId: number;
  createdAt: string;
  updatedAt: string;
}

/** Ejercicio principal de una sesión de entrenamiento. */
export interface FitnessExercise {
  exerciseId: string;
  name: string;
  description: string;
  muscleGroups: string[];
  equipment: string[];
  sets: number;
  reps: string;
  restSeconds: number;
  durationSeconds?: number;
  alternatives?: string[];
  instructions: string[];
}

/** Actividad de calentamiento o enfriamiento. */
export interface FitnessActivity {
  name: string;
  description: string;
  durationSeconds: number;
  instructions: string[];
}

/** Sesión de entrenamiento correspondiente a un día del plan. */
export interface FitnessWorkoutSession {
  id: number;
  planId: number;
  dayNumber: number;
  title: string;
  estimatedMinutes: number;
  warmup: FitnessActivity[];
  exercises: FitnessExercise[];
  cooldown: FitnessActivity[];
}

/** Información general de un plan generado. */
export interface FitnessPlan {
  id: number;
  clientId: number;
  profileSnapshot: FitnessProfileInput;
  name: string;
  status: FitnessPlanStatus;
  createdAt: string;
  updatedAt: string;
}

/** Plan que incluye todas sus sesiones de entrenamiento. */
export interface FitnessPlanWithSessions extends FitnessPlan {
  sessions: FitnessWorkoutSession[];
}

/** Datos enviados al registrar un entrenamiento completado. */
export interface FitnessWorkoutLogInput {
  durationMinutes?: number;
  perceivedEffort?: number;
  notes?: string;
}

/** Registro histórico de un entrenamiento realizado. */
export interface FitnessWorkoutLog extends FitnessWorkoutLogInput {
  id: number;
  sessionId: number;
  clientId: number;
  completedAt: string;
}
