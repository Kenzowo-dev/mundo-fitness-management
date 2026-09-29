export interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment?: string;
  difficulty: string;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExerciseData {
  name: string;
  description?: string;
  muscleGroup: string;
  secondaryMuscles?: string[];
  equipment?: string;
  difficulty?: string;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface WorkoutPlan {
  id: number;
  name: string;
  description?: string;
  goal?: string;
  difficulty: string;
  durationWeeks?: number;
  daysPerWeek?: number;
  isPublic: boolean;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
  days?: PlanDay[];
}

export interface CreatePlanData {
  name: string;
  description?: string;
  goal?: string;
  difficulty?: string;
  durationWeeks?: number;
  daysPerWeek?: number;
  isPublic?: boolean;
  createdBy?: number;
  days: CreatePlanDayData[];
}

export interface PlanDay {
  id: number;
  planId: number;
  dayNumber: number;
  name?: string;
  focus?: string;
  notes?: string;
  createdAt: Date;
  exercises?: PlanExercise[];
}

export interface CreatePlanDayData {
  dayNumber: number;
  name?: string;
  focus?: string;
  notes?: string;
  exercises: CreatePlanExerciseData[];
}

export interface PlanExercise {
  id: number;
  planDayId: number;
  exerciseId: number;
  exercise?: Exercise;
  orderIndex: number;
  sets: number;
  reps: string;
  restSeconds: number;
  weightPercentage?: number;
  notes?: string;
  createdAt: Date;
}

export interface CreatePlanExerciseData {
  exerciseId: number;
  orderIndex?: number;
  sets?: number;
  reps?: string;
  restSeconds?: number;
  weightPercentage?: number;
  notes?: string;
}

export interface ClientPlan {
  id: number;
  clientId: number;
  planId: number;
  plan?: WorkoutPlan;
  assignedBy?: number;
  startDate: Date;
  endDate?: Date;
  status: string;
  currentWeek: number;
  currentDay: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignPlanData {
  clientId: number;
  planId: number;
  assignedBy?: number;
  startDate?: string;
  endDate?: string;
}

export interface WorkoutLog {
  id: number;
  clientPlanId: number;
  clientId: number;
  planDayId: number;
  completedAt: Date;
  durationMinutes?: number;
  notes?: string;
  rating?: number;
  exercises?: LoggedExercise[];
}

export interface LoggedExercise {
  id: number;
  workoutLogId: number;
  planExerciseId: number;
  exerciseId: number;
  exercise?: Exercise;
  setsCompleted: number;
  repsCompleted: number[];
  weightsUsed: number[];
  rpe?: number;
  notes?: string;
}

export interface LogWorkoutData {
  clientPlanId: number;
  clientId: number;
  planDayId: number;
  durationMinutes?: number;
  notes?: string;
  rating?: number;
  exercises: LogWorkoutExerciseData[];
}

export interface LogWorkoutExerciseData {
  planExerciseId: number;
  exerciseId: number;
  setsCompleted: number;
  repsCompleted: number[];
  weightsUsed: number[];
  rpe?: number;
  notes?: string;
}