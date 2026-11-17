import { FITNESS_ADDITIONAL_EXERCISES } from "./fitness.catalog.extended.js";

import type {
  FitnessLevel,
  TrainingLocation,
} from "../models/fitness.model.js";

export type ExerciseCategory =
  | "strength"
  | "cardio"
  | "mobility";

export interface CatalogExercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  muscleGroups: string[];
  equipment: string[];
  locations: TrainingLocation[];
  levels: FitnessLevel[];
  lowImpact: boolean;
  instructions: string[];
  alternatives: string[];
}

export const FITNESS_EXERCISES: CatalogExercise[] = [
  {
    id: "chair-squat",
    name: "Sentadilla a una silla",
    description: "Fortalece las piernas utilizando una silla estable como referencia.",
    category: "strength",
    muscleGroups: ["quadriceps", "glutes"],
    equipment: ["chair"],
    locations: ["home", "gym"],
    levels: ["beginner", "intermediate"],
    lowImpact: true,
    instructions: [
      "Coloca una silla estable detrás de ti.",
      "Separa los pies aproximadamente al ancho de los hombros.",
      "Flexiona las rodillas lentamente hasta tocar la silla.",
      "Vuelve a levantarte de forma controlada.",
    ],
    alternatives: ["bodyweight-squat"],
  },
  {
    id: "bodyweight-squat",
    name: "Sentadilla con peso corporal",
    description: "Ejercicio de fuerza para piernas y glúteos.",
    category: "strength",
    muscleGroups: ["quadriceps", "glutes"],
    equipment: [],
    locations: ["home", "gym"],
    levels: ["beginner", "intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Coloca los pies al ancho de los hombros.",
      "Flexiona caderas y rodillas manteniendo el control.",
      "Desciende hasta una profundidad cómoda.",
      "Regresa a la posición inicial.",
    ],
    alternatives: ["chair-squat"],
  },
  {
    id: "wall-pushup",
    name: "Flexiones contra la pared",
    description: "Fortalece pecho y brazos con una inclinación accesible.",
    category: "strength",
    muscleGroups: ["chest", "triceps"],
    equipment: [],
    locations: ["home", "gym"],
    levels: ["beginner", "intermediate"],
    lowImpact: true,
    instructions: [
      "Apoya las manos contra una pared firme.",
      "Mantén el cuerpo alineado.",
      "Flexiona los codos acercando el pecho a la pared.",
      "Empuja suavemente hasta regresar.",
    ],
    alternatives: ["pushup"],
  },
  {
    id: "pushup",
    name: "Flexiones de brazos",
    description: "Ejercicio para pecho, tríceps y estabilidad corporal.",
    category: "strength",
    muscleGroups: ["chest", "triceps", "core"],
    equipment: [],
    locations: ["home", "gym"],
    levels: ["intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Coloca las manos debajo de los hombros.",
      "Mantén el abdomen firme y el cuerpo alineado.",
      "Flexiona los codos de forma controlada.",
      "Empuja hasta regresar a la posición inicial.",
    ],
    alternatives: ["wall-pushup"],
  },
  {
    id: "glute-bridge",
    name: "Puente de glúteos",
    description: "Fortalece glúteos y musculatura posterior.",
    category: "strength",
    muscleGroups: ["glutes", "hamstrings"],
    equipment: [],
    locations: ["home", "gym"],
    levels: ["beginner", "intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Acuéstate boca arriba con las rodillas flexionadas.",
      "Mantén los pies apoyados en el suelo.",
      "Eleva lentamente la cadera.",
      "Desciende de manera controlada.",
    ],
    alternatives: ["chair-squat"],
  },
  {
    id: "bird-dog",
    name: "Bird dog",
    description: "Mejora la estabilidad del tronco y la coordinación.",
    category: "mobility",
    muscleGroups: ["core", "back"],
    equipment: [],
    locations: ["home", "gym"],
    levels: ["beginner", "intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Colócate en cuatro apoyos.",
      "Extiende lentamente un brazo y la pierna contraria.",
      "Mantén la espalda estable.",
      "Regresa y alterna los lados.",
    ],
    alternatives: [],
  },
  {
    id: "dumbbell-row",
    name: "Remo con mancuerna",
    description: "Ejercicio para fortalecer la espalda.",
    category: "strength",
    muscleGroups: ["back", "biceps"],
    equipment: ["dumbbells"],
    locations: ["home", "gym"],
    levels: ["beginner", "intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Sujeta una mancuerna con una mano.",
      "Inclina ligeramente el torso manteniendo la espalda estable.",
      "Lleva el codo hacia atrás.",
      "Desciende la mancuerna lentamente.",
    ],
    alternatives: [],
  },
  {
    id: "dumbbell-press",
    name: "Press de hombros con mancuernas",
    description: "Fortalece hombros y tríceps.",
    category: "strength",
    muscleGroups: ["shoulders", "triceps"],
    equipment: ["dumbbells"],
    locations: ["home", "gym"],
    levels: ["intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Sujeta las mancuernas a la altura de los hombros.",
      "Mantén el tronco estable.",
      "Empuja las mancuernas hacia arriba sin forzar el recorrido.",
      "Desciende lentamente.",
    ],
    alternatives: ["wall-pushup"],
  },
  {
    id: "lat-pulldown",
    name: "Jalón al pecho",
    description: "Ejercicio de máquina para la musculatura de la espalda.",
    category: "strength",
    muscleGroups: ["back", "biceps"],
    equipment: ["machines"],
    locations: ["gym"],
    levels: ["beginner", "intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Ajusta el asiento y selecciona una carga ligera.",
      "Sujeta la barra con un agarre cómodo.",
      "Lleva la barra hacia la parte superior del pecho.",
      "Regresa lentamente sin perder el control.",
    ],
    alternatives: ["dumbbell-row"],
  },
  {
    id: "leg-press",
    name: "Prensa de piernas",
    description: "Fortalece las piernas utilizando una máquina.",
    category: "strength",
    muscleGroups: ["quadriceps", "glutes"],
    equipment: ["machines"],
    locations: ["gym"],
    levels: ["beginner", "intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Ajusta el asiento según tu estatura.",
      "Coloca los pies sobre la plataforma.",
      "Empuja sin bloquear completamente las rodillas.",
      "Regresa lentamente hasta un rango cómodo.",
    ],
    alternatives: ["chair-squat", "bodyweight-squat"],
  },
  {
    id: "walking",
    name: "Caminata",
    description: "Actividad cardiovascular de bajo impacto.",
    category: "cardio",
    muscleGroups: ["legs", "cardiovascular"],
    equipment: [],
    locations: ["home", "gym"],
    levels: ["beginner", "intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Comienza a un ritmo cómodo.",
      "Mantén una postura relajada.",
      "Aumenta el ritmo progresivamente si te resulta cómodo.",
      "Reduce la velocidad antes de finalizar.",
    ],
    alternatives: ["stationary-bike"],
  },
  {
    id: "stationary-bike",
    name: "Bicicleta estática",
    description: "Entrenamiento cardiovascular de bajo impacto.",
    category: "cardio",
    muscleGroups: ["legs", "cardiovascular"],
    equipment: ["stationary_bike"],
    locations: ["home", "gym"],
    levels: ["beginner", "intermediate", "advanced"],
    lowImpact: true,
    instructions: [
      "Ajusta la altura del asiento.",
      "Comienza con una resistencia ligera.",
      "Pedalea a un ritmo cómodo y constante.",
      "Reduce progresivamente la intensidad al terminar.",
    ],
    alternatives: ["walking"],
  },
  ...FITNESS_ADDITIONAL_EXERCISES,
];

export function getExerciseById(
  id: string,
): CatalogExercise | undefined {
  return FITNESS_EXERCISES.find((exercise) => exercise.id === id);
}
