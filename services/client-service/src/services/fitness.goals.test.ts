import { describe, expect, it } from "vitest";
import type { FitnessProfileInput } from "../models/fitness.model.js";
import { generateFitnessPlan } from "./fitness.generator.js";
import { getExerciseById } from "./fitness.catalog.js";

const baseProfile: FitnessProfileInput = {
  fitnessLevel: "beginner",
  trainingLocation: "home",
  equipment: [],
  daysPerWeek: 4,
  sessionMinutes: 45,
  preferredGoal: "general",
  preferredExerciseTypes: [],
  avoidedExerciseIds: [],
  preferredIntensity: "moderate",
  mobilityNotes: null,
};

const goals: Array<{
  goal: FitnessProfileInput["preferredGoal"];
  expectedCategory: "strength" | "cardio";
}> = [
  { goal: "weight", expectedCategory: "cardio" },
  { goal: "muscle", expectedCategory: "strength" },
  { goal: "body_fat", expectedCategory: "cardio" },
  { goal: "endurance", expectedCategory: "cardio" },
  { goal: "strength", expectedCategory: "strength" },
  { goal: "general", expectedCategory: "strength" },
];

describe("Objetivos del recomendador fitness", () => {
  it.each(goals)(
    "genera una rutina válida para $goal",
    ({ goal, expectedCategory }) => {
      const plan = generateFitnessPlan({
        ...baseProfile,
        preferredGoal: goal,
      });

      expect(plan.sessions).toHaveLength(4);

      for (const session of plan.sessions) {
        expect(session.exercises.length).toBeGreaterThan(0);
        expect(session.estimatedMinutes).toBeLessThanOrEqual(45);

        const first = session.exercises[0];
        expect(getExerciseById(first.exerciseId)?.category)
          .toBe(expectedCategory);

        for (const exercise of session.exercises) {
          expect(getExerciseById(exercise.exerciseId))
            .toBeDefined();
          expect(exercise.equipment).toEqual([]);
          expect(exercise.instructions.length)
            .toBeGreaterThan(0);
        }
      }
    },
  );

  it.each([1, 2, 3, 4, 5, 6, 7])(
    "genera exactamente %i días de entrenamiento",
    (days) => {
      const plan = generateFitnessPlan({
        ...baseProfile,
        daysPerWeek: days,
      });

      expect(plan.sessions).toHaveLength(days);

      expect(
        new Set(plan.sessions.map((session) => session.dayNumber)).size,
      ).toBe(days);

      for (const session of plan.sessions) {
        expect(session.exercises.length).toBeGreaterThan(0);
        expect(session.estimatedMinutes).toBeLessThanOrEqual(45);
      }
    },
  );

  it("diferencia repeticiones de fuerza y resistencia", () => {
    const strengthPlan = generateFitnessPlan({
      ...baseProfile,
      preferredGoal: "strength",
    });

    const endurancePlan = generateFitnessPlan({
      ...baseProfile,
      preferredGoal: "endurance",
    });

    const strengthExercise = strengthPlan.sessions
      .flatMap((session) => session.exercises)
      .find((exercise) =>
        getExerciseById(exercise.exerciseId)?.category === "strength",
      );

    const enduranceExercise = endurancePlan.sessions
      .flatMap((session) => session.exercises)
      .find((exercise) =>
        getExerciseById(exercise.exerciseId)?.category === "strength",
      );

    expect(strengthExercise).toBeDefined();
    expect(enduranceExercise).toBeDefined();

    expect(strengthExercise?.reps).toBe("6-10");
    expect(enduranceExercise?.reps).toBe("12-15");
  });
});