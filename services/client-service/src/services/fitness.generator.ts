import { ValidationError } from "@gym/shared/errors/index.js";
import type {
  FitnessActivity,
  FitnessExercise,
  FitnessProfileInput,
} from "../models/fitness.model.js";

import {
  FITNESS_EXERCISES,
  type CatalogExercise,
} from "./fitness.catalog.js";

export interface GeneratedWorkoutSession {
  dayNumber: number;
  title: string;
  estimatedMinutes: number;
  warmup: FitnessActivity[];
  exercises: FitnessExercise[];
  cooldown: FitnessActivity[];
}

export interface GeneratedFitnessPlan {
  name: string;
  sessions: GeneratedWorkoutSession[];
}

const WEEK_DAYS = [1, 3, 5, 2, 4, 6, 7];

export function resolveFitnessTrainingDays(
  { daysPerWeek, trainingDays }: Pick<FitnessProfileInput, "daysPerWeek" | "trainingDays">,
): number[] {
  const days = trainingDays ?? WEEK_DAYS.slice(0, daysPerWeek);
  if (
    days.length !== daysPerWeek ||
    new Set(days).size !== days.length ||
    days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)
  ) {
    throw new ValidationError(
      "Selecciona tantos días distintos como entrenamientos por semana.",
    );
  }
  return [...days].sort((a, b) => a - b);
}

const VALID_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_LOCATIONS = ["home", "gym", "both"];
const VALID_GOALS = [
  "weight",
  "muscle",
  "body_fat",
  "endurance",
  "strength",
  "general",
];

function validateProfile(profile: FitnessProfileInput): void {
  if (
    !VALID_LEVELS.includes(profile.fitnessLevel) ||
    !VALID_LOCATIONS.includes(profile.trainingLocation) ||
    !VALID_GOALS.includes(profile.preferredGoal)
  ) {
    throw new Error("Preferencias fitness inválidas.");
  }

  if (
    !Number.isInteger(profile.daysPerWeek) ||
    profile.daysPerWeek < 1 ||
    profile.daysPerWeek > 7
  ) {
    throw new Error("Los días de entrenamiento deben estar entre 1 y 7.");
  }

  if (
    !Number.isInteger(profile.sessionMinutes) ||
    profile.sessionMinutes < 15 ||
    profile.sessionMinutes > 120
  ) {
    throw new Error("La duración debe estar entre 15 y 120 minutos.");
  }

  if (
    !Array.isArray(profile.equipment) ||
    !profile.equipment.every((item) => typeof item === "string")
  ) {
    throw new Error("El equipamiento seleccionado no es válido.");
  }

  if (
    profile.mobilityNotes != null &&
    typeof profile.mobilityNotes !== "string"
  ) {
    throw new Error("Las notas de movilidad no son válidas.");
  }
}

function isExerciseAvailable(
  exercise: CatalogExercise,
  profile: FitnessProfileInput,
): boolean {
  const locationAllowed =
    profile.trainingLocation === "both" ||
    exercise.locations.includes(profile.trainingLocation);

  const levelAllowed = exercise.levels.includes(profile.fitnessLevel);

  const equipmentAllowed = exercise.equipment.every(
    (item) =>
      profile.equipment.includes(item) ||
      (profile.trainingLocation === "gym" && item === "machines"),
  );

  return locationAllowed && levelAllowed && equipmentAllowed;
}

function getSets(profile: FitnessProfileInput): number {
  // Limitar el volumen de entrenamiento según la experiencia.
  const intensity = profile.preferredIntensity ?? "moderate";

  const setsByLevel = {
    beginner: { light: 1, moderate: 2, intense: 2 },
    intermediate: { light: 2, moderate: 3, intense: 4 },
    advanced: { light: 3, moderate: 4, intense: 5 },
  };

  return setsByLevel[profile.fitnessLevel][intensity];
}

function getReps(
  exercise: CatalogExercise,
  profile: FitnessProfileInput,
): string {
  if (exercise.category === "cardio") {
    return "5 minutos";
  }

  if (profile.preferredGoal === "strength") return "6-10";
  if (profile.preferredGoal === "endurance") return "12-15";

  return "8-12";
}

function toFitnessExercise(
  exercise: CatalogExercise,
  profile: FitnessProfileInput,
): FitnessExercise {
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    description: exercise.description,
    muscleGroups: exercise.muscleGroups,
    equipment: exercise.equipment,
    sets: exercise.category === "cardio" ? 1 : getSets(profile),
    reps: getReps(exercise, profile),
    restSeconds:
      exercise.category === "cardio"
        ? 30
        : profile.preferredGoal === "strength"
          ? 90
          : 60,
    durationSeconds:
      exercise.category === "cardio" ? 300 : undefined,
    alternatives: exercise.alternatives.filter(
      (alternativeId) => {
        const alternative = FITNESS_EXERCISES.find(
          (item) => item.id === alternativeId,
        );

        return (
          alternative !== undefined &&
          isExerciseAvailable(alternative, profile) &&
          !(profile.avoidedExerciseIds ?? []).includes(alternativeId)
        );
      },
    ),
    instructions: exercise.instructions,
  };
}

function getWarmup(): FitnessActivity[] {
  return [
    {
      name: "Movilidad articular suave",
      description: "Preparación progresiva de las articulaciones.",
      durationSeconds: 120,
      instructions: [
        "Realiza movimientos lentos y controlados.",
        "Evita forzar las articulaciones.",
      ],
    },
    {
      name: "Marcha suave",
      description: "Activación cardiovascular progresiva.",
      durationSeconds: 180,
      instructions: [
        "Marcha a un ritmo cómodo.",
        "Aumenta ligeramente el ritmo si te sientes bien.",
      ],
    },
  ];
}

function getCooldown(): FitnessActivity[] {
  return [
    {
      name: "Caminata suave",
      description: "Reducción progresiva de la intensidad.",
      durationSeconds: 120,
      instructions: [
        "Camina lentamente.",
        "Recupera una respiración cómoda.",
      ],
    },
    {
      name: "Movilidad y respiración",
      description: "Finalización tranquila de la sesión.",
      durationSeconds: 180,
      instructions: [
        "Realiza movimientos suaves.",
        "Respira de forma natural.",
        "No fuerces los estiramientos.",
      ],
    },
  ];
}

function estimateExerciseSeconds(exercise: FitnessExercise): number {
  if (exercise.durationSeconds !== undefined) {
    return exercise.durationSeconds;
  }

  const secondsPerSet = 45;

  return (
    exercise.sets * secondsPerSet +
    Math.max(0, exercise.sets - 1) * exercise.restSeconds
  );
}

function estimateSessionMinutes(
  warmup: FitnessActivity[],
  exercises: FitnessExercise[],
  cooldown: FitnessActivity[],
): number {
  const warmupSeconds = warmup.reduce(
    (total, item) => total + item.durationSeconds,
    0,
  );

  const exerciseSeconds = exercises.reduce(
    (total, exercise) => total + estimateExerciseSeconds(exercise),
    0,
  );

  const cooldownSeconds = cooldown.reduce(
    (total, item) => total + item.durationSeconds,
    0,
  );

  return Math.ceil(
    (warmupSeconds + exerciseSeconds + cooldownSeconds) / 60,
  );
}

function selectExercises(
  available: CatalogExercise[],
  profile: FitnessProfileInput,
  sessionIndex: number,
  currentDay: number,
  previousSessions: GeneratedWorkoutSession[],
): FitnessExercise[] {
  const usageCounts = new Map<string, number>();

  for (const session of previousSessions) {
    for (const exercise of session.exercises) {
      usageCounts.set(
        exercise.exerciseId,
        (usageCounts.get(exercise.exerciseId) ?? 0) + 1,
      );
    }
  }

  // Considerar grupos trabajados en días cercanos.
  // Es una preferencia de selección, no una garantía clínica de recuperación.
  const nearbyMuscles = new Set<string>();

  for (const session of previousSessions) {
    if (Math.abs(session.dayNumber - currentDay) > 1) {
      continue;
    }

    for (const exercise of session.exercises) {
      for (const muscle of exercise.muscleGroups) {
        nearbyMuscles.add(muscle);
      }
    }
  }

  const prioritize = (
    exercises: CatalogExercise[],
  ): CatalogExercise[] => {
    if (exercises.length === 0) return [];

    const offset = sessionIndex % exercises.length;

    const rotated = [
      ...exercises.slice(offset),
      ...exercises.slice(0, offset),
    ];

    const score = (exercise: CatalogExercise): number => {
      const repeated = usageCounts.get(exercise.id) ?? 0;

      const nearbyOverlap = exercise.muscleGroups.filter(
        (muscle) => nearbyMuscles.has(muscle),
      ).length;

      return repeated * 3 + nearbyOverlap;
    };

    return rotated.sort(
      (a, b) => score(a) - score(b),
    );
  };

  type Category = CatalogExercise["category"];

  const categories: Record<Category, CatalogExercise[]> = {
    strength: prioritize(
      available.filter((exercise) => exercise.category === "strength"),
    ),
    cardio: prioritize(
      available.filter((exercise) => exercise.category === "cardio"),
    ),
    mobility: prioritize(
      available.filter((exercise) => exercise.category === "mobility"),
    ),
  };

  const cardioGoals = ["weight", "body_fat", "endurance"];

  const defaultOrder: Category[] = cardioGoals.includes(
    profile.preferredGoal,
  )
    ? ["cardio", "strength", "mobility"]
    : ["strength", "cardio", "mobility"];

  const preferences = profile.preferredExerciseTypes ?? [];

  const categoryOrder: Category[] = [
    ...new Set<Category>([
      ...preferences,
      ...defaultOrder,
    ]),
  ];

  const selected: FitnessExercise[] = [];
  const selectedIds = new Set<string>();
  const usedMuscles = new Set<string>();

  const warmup = getWarmup();
  const cooldown = getCooldown();

  // Reservar aproximadamente diez minutos para calentamiento
  // y enfriamiento. Mantener sesiones manejables.
  const maxExercises = Math.max(
    1,
    Math.min(
      6,
      Math.floor((profile.sessionMinutes - 10) / 7),
    ),
  );

  let addedInRound = true;

  // Distribuir la selección entre categorías.
  while (addedInRound && selected.length < maxExercises) {
    addedInRound = false;

    for (const category of categoryOrder) {
      if (selected.length >= maxExercises) break;

      for (const exercise of categories[category]) {
        if (selectedIds.has(exercise.id)) continue;

        const overlaps = exercise.muscleGroups.some(
          (muscle) => usedMuscles.has(muscle),
        );

        if (overlaps && selected.length > 0) continue;

        const candidate = toFitnessExercise(exercise, profile);
        const proposed = [...selected, candidate];

        if (
          estimateSessionMinutes(warmup, proposed, cooldown) >
          profile.sessionMinutes
        ) {
          continue;
        }

        selected.push(candidate);
        selectedIds.add(exercise.id);

        for (const muscle of exercise.muscleGroups) {
          usedMuscles.add(muscle);
        }

        addedInRound = true;
        break;
      }
    }
  }

  if (selected.length === 0) {
    throw new Error(
      "No se pudo generar una rutina dentro del tiempo disponible.",
    );
  }

  return selected;
}
export function generateFitnessPlan(
  profile: FitnessProfileInput,
): GeneratedFitnessPlan {
  validateProfile(profile);

  if (profile.mobilityNotes?.trim()) {
    throw new Error(
      "Las limitaciones de movilidad requieren una evaluación antes de generar una rutina automática.",
    );
  }

  // Excluir ejercicios que el socio ha indicado que desea evitar.
  const avoidedExercises = new Set(
    profile.avoidedExerciseIds ?? [],
  );

  const available = FITNESS_EXERCISES.filter(
    (exercise) =>
      isExerciseAvailable(exercise, profile) &&
      !avoidedExercises.has(exercise.id),
  );

  if (available.length === 0) {
    throw new Error(
      "No hay ejercicios disponibles para las preferencias seleccionadas.",
    );
  }

  const sessions: GeneratedWorkoutSession[] = [];

  const days = resolveFitnessTrainingDays(profile);
  for (const [index, day] of days.entries()) {
    const exercises = selectExercises(available, profile, index, day, sessions);
    const warmup = getWarmup();
    const cooldown = getCooldown();

    sessions.push({
      dayNumber: day,
      title: `Entrenamiento ${index + 1}`,
      estimatedMinutes: estimateSessionMinutes(
        warmup,
        exercises,
        cooldown,
      ),
      warmup,
      exercises,
      cooldown,
    });
  }

  return {
    name: `Plan fitness - ${profile.daysPerWeek} días por semana`,
    sessions,
  };
}
