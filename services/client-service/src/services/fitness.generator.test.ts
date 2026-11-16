import { describe, expect, it } from "vitest";

import type { FitnessProfileInput } from "../models/fitness.model.js";
import { generateFitnessPlan } from "./fitness.generator.js";

const beginnerProfile: FitnessProfileInput = {
  fitnessLevel: "beginner",
  trainingLocation: "home",
  equipment: [],
  daysPerWeek: 3,
  sessionMinutes: 45,
  preferredGoal: "general",
  mobilityNotes: null,
};

describe("Fitness recommender generator", () => {
  it("genera tres sesiones para un principiante", () => {
    const plan = generateFitnessPlan(beginnerProfile);

    expect(plan.sessions).toHaveLength(3);
    expect(plan.sessions.map((session) => session.dayNumber))
      .toEqual([1, 3, 5]);

    for (const session of plan.sessions) {
      expect(session.warmup.length).toBeGreaterThan(0);
      expect(session.exercises.length).toBeGreaterThan(0);
      expect(session.cooldown.length).toBeGreaterThan(0);
    }
  });

  it("no recomienda equipamiento no disponible en casa", () => {
    const plan = generateFitnessPlan(beginnerProfile);

    for (const session of plan.sessions) {
      for (const exercise of session.exercises) {
        expect(exercise.equipment).toEqual([]);
      }
    }
  });

  it("genera cinco sesiones semanales", () => {
    const plan = generateFitnessPlan({
      ...beginnerProfile,
      daysPerWeek: 5,
    });

    expect(plan.sessions).toHaveLength(5);
    expect(new Set(plan.sessions.map((s) => s.dayNumber)).size)
      .toBe(5);
  });

  it("permite utilizar maquinas del gimnasio", () => {
    const plan = generateFitnessPlan({
      ...beginnerProfile,
      trainingLocation: "gym",
      equipment: ["machines"],
      daysPerWeek: 3,
    });

    const exercises = plan.sessions.flatMap(
      (session) => session.exercises,
    );

    expect(exercises.some((exercise) =>
      exercise.equipment.includes("machines"),
    )).toBe(true);
  });

  it("excluye los ejercicios que el socio desea evitar", () => {
    const avoidedExerciseIds = [
      "bodyweight-squat",
      "walking",
    ];

    const plan = generateFitnessPlan({
      ...beginnerProfile,
      avoidedExerciseIds,
    });

    const exercises = plan.sessions.flatMap(
      (session) => session.exercises,
    );

    expect(exercises.length).toBeGreaterThan(0);

    for (const exercise of exercises) {
      expect(avoidedExerciseIds).not.toContain(
        exercise.exerciseId,
      );
    }
  });

  it("prioriza cardio cuando el socio lo prefiere", () => {
    const plan = generateFitnessPlan({
      ...beginnerProfile,
      preferredExerciseTypes: ["cardio"],
    });

    const firstExercise = plan.sessions[0].exercises[0];

    expect(firstExercise.exerciseId).toBe("walking");
  });

  it("mantiene sesiones v?lidas con preferencias m?ltiples", () => {
    const plan = generateFitnessPlan({
      ...beginnerProfile,
      preferredExerciseTypes: ["mobility", "cardio"],
    });

    expect(plan.sessions).toHaveLength(3);

    for (const session of plan.sessions) {
      expect(session.exercises.length).toBeGreaterThan(0);
      expect(session.estimatedMinutes).toBeLessThanOrEqual(45);
    }
  });

  it("reduce las series con intensidad ligera", () => {
    const plan = generateFitnessPlan({
      ...beginnerProfile,
      preferredIntensity: "light",
    });

    const strengthExercise = plan.sessions
      .flatMap((session) => session.exercises)
      .find((exercise) => exercise.exerciseId === "bodyweight-squat");

    expect(strengthExercise).toBeDefined();
    expect(strengthExercise?.sets).toBe(1);
  });

  it("limita la intensidad intensa para principiantes", () => {
    const plan = generateFitnessPlan({
      ...beginnerProfile,
      preferredIntensity: "intense",
    });

    const exercises = plan.sessions.flatMap(
      (session) => session.exercises,
    );

    for (const exercise of exercises) {
      expect(exercise.sets).toBeLessThanOrEqual(2);
    }
  });

  it("no sugiere alternativas excluidas o incompatibles", () => {
    const avoidedExerciseIds = ["bodyweight-squat"];

    const plan = generateFitnessPlan({
      ...beginnerProfile,
      equipment: ["chair"],
      avoidedExerciseIds,
    });

    const exercises = plan.sessions.flatMap(
      (session) => session.exercises,
    );

    const chairSquat = exercises.find(
      (exercise) => exercise.exerciseId === "chair-squat",
    );

    expect(chairSquat).toBeDefined();
    expect(chairSquat?.alternatives).not.toContain(
      "bodyweight-squat",
    );

    for (const exercise of exercises) {
      for (const alternativeId of exercise.alternatives ?? []) {
        expect(avoidedExerciseIds).not.toContain(alternativeId);
        expect(alternativeId).not.toBe("pushup");
        expect(alternativeId).not.toBe("stationary-bike");
      }
    }
  });

  it("incluye calentamiento y vuelta a la calma", () => {
    const plan = generateFitnessPlan(beginnerProfile);

    for (const session of plan.sessions) {
      expect(session.warmup).not.toHaveLength(0);
      expect(session.cooldown).not.toHaveLength(0);
      expect(session.estimatedMinutes).toBeGreaterThan(0);
      expect(session.estimatedMinutes).toBeLessThanOrEqual(
        beginnerProfile.sessionMinutes,
      );
    }
  });
});
