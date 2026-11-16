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
  // Limitar el volumen de entrenamiento seg?n la experiencia.
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
): FitnessExercise[] {
  const strength = available.filter(
    (exercise) => exercise.category === "strength",
  );

  const cardio = available.filter(
    (exercise) => exercise.category === "cardio",
  );

  const mobility = available.filter(
    (exercise) => exercise.category === "mobility",
  );

  // Rotar los ejercicios de fuerza para variar las sesiones.
  const offset = sessionIndex % Math.max(1, strength.length);

  const rotatedStrength = [
    ...strength.slice(offset),
    ...strength.slice(0, offset),
  ];

  // Priorizar las categor?as elegidas sin excluir las dem?s.
  const categories = {
    strength: rotatedStrength,
    mobility,
    cardio,
  };

  const defaultOrder = [
    "strength",
    "mobility",
    "cardio",
  ] as const;

  const preferences = profile.preferredExerciseTypes ?? [];

  const categoryOrder = [
    ...preferences,
    ...defaultOrder.filter(
      (category) => !preferences.includes(category),
    ),
  ];

  const ordered = categoryOrder.flatMap(
    (category) => categories[category],
  );

  const selected: FitnessExercise[] = [];
  const usedMuscles = new Set<string>();

  const warmup = getWarmup();
  const cooldown = getCooldown();

  for (const exercise of ordered) {
    if (selected.some((item) => item.exerciseId === exercise.id)) {
      continue;
    }

    const overlaps = exercise.muscleGroups.some(
      (muscle) => usedMuscles.has(muscle),
    );

    if (overlaps && selected.length > 0) {
      continue;
    }

    const candidate = toFitnessExercise(exercise, profile);
    const proposed = [...selected, candidate];

    if (
      estimateSessionMinutes(warmup, proposed, cooldown) >
      profile.sessionMinutes
    ) {
      continue;
    }

    selected.push(candidate);

    for (const muscle of exercise.muscleGroups) {
      usedMuscles.add(muscle);
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

  for (let index = 0; index < profile.daysPerWeek; index++) {
    const exercises = selectExercises(available, profile, index);
    const warmup = getWarmup();
    const cooldown = getCooldown();

    sessions.push({
      dayNumber: WEEK_DAYS[index],
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
