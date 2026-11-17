import { describe, expect, it } from "vitest";
import { FITNESS_EXERCISES } from "./fitness.catalog.js";

describe("Integridad del catálogo fitness", () => {
  const ids = FITNESS_EXERCISES.map((exercise) => exercise.id);
  const knownIds = new Set(ids);
  const allowedEquipment = new Set([
    "chair",
    "dumbbells",
    "machines",
    "stationary_bike",
  ]);

  it("incluye al menos cuarenta ejercicios", () => {
    expect(FITNESS_EXERCISES.length).toBeGreaterThanOrEqual(40);
  });

  it("no contiene identificadores duplicados", () => {
    expect(knownIds.size).toBe(ids.length);
  });

  it("mantiene información completa y válida", () => {
    for (const exercise of FITNESS_EXERCISES) {
      expect(exercise.id.length).toBeGreaterThan(0);
      expect(exercise.name.length).toBeGreaterThan(0);
      expect(exercise.description.length).toBeGreaterThan(0);
      expect(exercise.instructions.length).toBeGreaterThanOrEqual(3);
      expect(exercise.levels.length).toBeGreaterThan(0);
      expect(exercise.locations.length).toBeGreaterThan(0);
      expect(
        exercise.equipment.every((item) => allowedEquipment.has(item)),
      ).toBe(true);
    }
  });

  it("todas las alternativas corresponden a ejercicios existentes", () => {
    for (const exercise of FITNESS_EXERCISES) {
      for (const alternative of exercise.alternatives) {
        expect(knownIds.has(alternative)).toBe(true);
        expect(alternative).not.toBe(exercise.id);
      }
    }
  });

  it("incluye fuerza, cardio y movilidad para principiantes en casa", () => {
    for (const category of ["strength", "cardio", "mobility"]) {
      const available = FITNESS_EXERCISES.filter(
        (exercise) =>
          exercise.category === category &&
          exercise.levels.includes("beginner") &&
          exercise.locations.includes("home") &&
          exercise.equipment.length === 0,
      );

      expect(available.length).toBeGreaterThan(0);
    }
  });
});