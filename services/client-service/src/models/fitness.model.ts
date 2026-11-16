export type FitnessLevel =
  | "beginner"
  | "intermediate"
  | "advanced";

export type TrainingLocation =
  | "home"
  | "gym"
  | "both";

export type FitnessGoal =
  | "weight"
  | "muscle"
  | "body_fat"
  | "endurance"
  | "strength"
  | "general";

export type FitnessPlanStatus =
  | "active"
  | "completed"
  | "archived";

export type ExercisePreference =
  | "strength"
  | "cardio"
  | "mobility";

export type PreferredIntensity =
  | "light"
  | "moderate"
  | "intense";

/**
 * Preferencias del socio para personalizar los entrenamientos
 * y las futuras sugerencias de alimentaci?n.
 */
export interface FitnessProfileInput {
  fitnessLevel: FitnessLevel;
  trainingLocation: TrainingLocation;
  equipment: string[];
  daysPerWeek: number;
  sessionMinutes: number;
  preferredGoal: FitnessGoal;
  mobilityNotes?: string | null;

  /** Tipos de ejercicios que el socio prefiere realizar. */
  preferredExerciseTypes?: ExercisePreference[];

  /** Identificadores de ejercicios que desea evitar. */
  avoidedExerciseIds?: string[];

  /** Intensidad preferida, limitada por el nivel del socio. */
  preferredIntensity?: PreferredIntensity;

  /** Preferencias alimentarias generales. */
  dietaryPreferences?: string[];

  /** Ingredientes que el socio prefiere evitar. */
  dislikedIngredients?: string[];

  /** Alergias alimentarias declaradas por el socio. */
  foodAllergies?: string[];
}

export interface FitnessProfile extends FitnessProfileInput {
  id: number;
  clientId: number;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface FitnessActivity {
  name: string;
  description: string;
  durationSeconds: number;
  instructions: string[];
}

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

export interface FitnessPlan {
  id: number;
  clientId: number;
  profileSnapshot: FitnessProfileInput;
  name: string;
  status: FitnessPlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FitnessPlanWithSessions extends FitnessPlan {
  sessions: FitnessWorkoutSession[];
}

export interface FitnessWorkoutLogInput {
  durationMinutes?: number;
  perceivedEffort?: number;
  notes?: string;
}

export interface FitnessWorkoutLog extends FitnessWorkoutLogInput {
  id: number;
  sessionId: number;
  clientId: number;
  completedAt: Date;
}
