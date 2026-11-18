import { describe, expect, it } from "vitest";
import type { FitnessProfileInput } from "../models/fitness.model.js";
import { getExerciseById } from "./fitness.catalog.js";
import { generateFitnessPlan } from "./fitness.generator.js";

const profile: FitnessProfileInput = {
  fitnessLevel: "beginner",
  trainingLocation: "home",
  equipment: [],
  daysPerWeek: 4,
  sessionMinutes: 45,
  preferredGoal: "general",
  mobilityNotes: null,
};

describe("Personalizacion avanzada fitness", () => {
  it("genera cuatro sesiones con variedad semanal", () => {
    const plan = generateFitnessPlan(profile);

    expect(plan.sessions).toHaveLength(4);

    const signatures = plan.sessions.map((session) =>
      session.exercises.map((exercise) => exercise.exerciseId).join(","),
    );

    expect(new Set(signatures).size).toBeGreaterThan(1);
  });

  it("prioriza cardio para un objetivo de resistencia", () => {
    const plan = generateFitnessPlan({
      ...profile,
      preferredGoal: "endurance",
    });

    const firstId = plan.sessions[0].exercises[0].exerciseId;

    expect(getExerciseById(firstId)?.category).toBe("cardio");
  });

  it("no repite ejercicios dentro de una misma sesion", () => {
    const plan = generateFitnessPlan(profile);

    for (const session of plan.sessions) {
      const ids = session.exercises.map(
        (exercise) => exercise.exerciseId,
      );

      expect(new Set(ids).size).toBe(ids.length);
      expect(session.exercises.length).toBeLessThanOrEqual(6);
    }
  });

  it("respeta sesiones cortas de quince minutos", () => {
    const plan = generateFitnessPlan({
      ...profile,
      sessionMinutes: 15,
      daysPerWeek: 2,
    });

    for (const session of plan.sessions) {
      expect(session.exercises.length).toBeGreaterThan(0);
      expect(session.estimatedMinutes).toBeLessThanOrEqual(15);
    }
  });

  it("mantiene equipamiento y exclusiones", () => {
    const avoidedExerciseIds = [
      "bodyweight-squat",
      "walking",
      "march-in-place",
    ];

    const plan = generateFitnessPlan({
      ...profile,
      avoidedExerciseIds,
    });

    for (const session of plan.sessions) {
      for (const exercise of session.exercises) {
        expect(exercise.equipment).toEqual([]);
        expect(avoidedExerciseIds).not.toContain(exercise.exerciseId);
      }
    }
  });
});