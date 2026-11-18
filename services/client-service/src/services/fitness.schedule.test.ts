import { beforeEach, describe, expect, it, vi } from "vitest";
import { query } from "@gym/shared/database/index.js";
import type { FitnessProfileInput } from "../models/fitness.model.js";
import { generateFitnessPlan } from "./fitness.generator.js";
import {
  completeFitnessWorkout,
  getFitnessProfile,
  getFitnessWorkoutHistory,
  saveFitnessProfile,
} from "./fitness.service.js";

vi.mock("@gym/shared/database/index.js", () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

const db = vi.mocked(query);

function result(...rows: Record<string, unknown>[]): Awaited<ReturnType<typeof query>> {
  return { rows, rowCount: rows.length, command: "", oid: 0, fields: [] };
}
const profile: FitnessProfileInput = {
  fitnessLevel: "beginner",
  trainingLocation: "home",
  equipment: [],
  daysPerWeek: 3,
  trainingDays: [7, 2, 4],
  sessionMinutes: 45,
  preferredGoal: "general",
};

beforeEach(() => db.mockReset());

describe("Planificación fitness", () => {
  it("envía los días ordenados a PostgreSQL y los recupera al leer el perfil", async () => {
    const row = { id: "1", client_id: "42", days_per_week: 3, training_days: [2, 4, 7] };
    db.mockResolvedValueOnce(result(row)).mockResolvedValueOnce(result(row));

    expect(await saveFitnessProfile(42, profile)).toMatchObject({ trainingDays: [2, 4, 7] });
    const [sql, params] = db.mock.calls[0];
    expect(sql).toContain("training_days = CASE");
    expect(params?.[14]).toEqual([2, 4, 7]);
    expect(await getFitnessProfile(42)).toMatchObject({ trainingDays: [2, 4, 7] });
  });

  it.each([[2, 4], [2, 2, 7], [2, 4, 8]])("rechaza días inválidos: %j", async (...days) => {
    await expect(saveFitnessProfile(42, { ...profile, trainingDays: days }))
      .rejects.toThrow("Selecciona tantos días distintos");
    expect(db).not.toHaveBeenCalled();
  });

  it("genera las sesiones elegidas en orden de lunes a domingo", () => {
    const plan = generateFitnessPlan(profile);
    expect(plan.sessions.map(({ dayNumber, title }) => [dayNumber, title])).toEqual([
      [2, "Entrenamiento 1"], [4, "Entrenamiento 2"], [7, "Entrenamiento 3"],
    ]);
  });

  it("mantiene los mismos días para preferencias antiguas", () => {
    const plan = generateFitnessPlan({ ...profile, daysPerWeek: 5, trainingDays: undefined });
    expect(plan.sessions.map(({ dayNumber }) => dayNumber)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("Registros fitness", () => {
  const log = {
    id: "1", session_id: "8", client_id: "42", completed_at: new Date(),
    performed_on_text: "2026-11-16",
  };

  it("persiste la fecha declarada y traduce el conflicto del índice a 409", async () => {
    db.mockResolvedValueOnce(result(log))
      .mockResolvedValueOnce(result())
      .mockResolvedValueOnce(result({ already_registered: true }));
    const data = { performedOn: "2026-11-16" };
    expect(await completeFitnessWorkout(42, 8, data)).toMatchObject(data);
    expect(db.mock.calls[0][0]).toContain("ON CONFLICT (session_id, performed_on)");
    expect(db.mock.calls[0][1]?.[5]).toBe(data.performedOn);
    await expect(completeFitnessWorkout(42, 8, data)).rejects.toMatchObject({
      statusCode: 409, code: "FITNESS_WORKOUT_ALREADY_REGISTERED",
    });
  });

  it("conserva registros antiguos sin atribuirles una fecha real", async () => {
    db.mockResolvedValueOnce(result({
      ...log, performed_on_text: null, session_title: "Entrenamiento anterior",
    }));
    const [entry] = await getFitnessWorkoutHistory(42);
    expect(entry.sessionTitle).toBe("Entrenamiento anterior");
    expect(entry.performedOn).toBeUndefined();
    expect(entry.completedAt).toEqual(log.completed_at);
  });
});
