import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@gym/shared/database/index.js", () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

import { query, transaction } from "@gym/shared/database/index.js";
import { createFitnessPlan } from "./fitness.service.js";

const queryMock = vi.mocked(query);
const transactionMock = vi.mocked(transaction);

const profileRow = {
  id: "10",
  client_id: "42",
  fitness_level: "beginner",
  training_location: "home",
  equipment: [],
  days_per_week: 4,
  session_minutes: 45,
  preferred_goal: "general",
  mobility_notes: null,
  preferred_exercise_types: [],
  avoided_exercise_ids: [],
  preferred_intensity: "moderate",
  dietary_preferences: [],
  disliked_ingredients: [],
  food_allergies: [],
  created_at: new Date(),
  updated_at: new Date(),
};

const planRow = {
  id: "100",
  client_id: "42",
  profile_snapshot: {},
  name: "Plan fitness - 4 días por semana",
  status: "active",
  created_at: new Date(),
  updated_at: new Date(),
};

describe("Actualizacion de rutinas fitness", () => {
  const statements: string[] = [];
  let sessionCount = 0;
  let failOnPlanInsert = false;
  let clientExists = true;

  const clientQueryMock = vi.fn(
    async (sql: string, params?: unknown[]) => {
      statements.push(sql);

      if (sql.includes("FROM clients") && sql.includes("FOR UPDATE")) {
        expect(params).toEqual([42]);

        return {
          rowCount: clientExists ? 1 : 0,
          rows: clientExists ? [{ id: "42" }] : [],
        };
      }

      if (sql.includes("UPDATE fitness_plans")) {
        expect(params).toEqual([42]);

        return { rowCount: 1, rows: [] };
      }

      if (sql.includes("INSERT INTO fitness_plans")) {
        if (failOnPlanInsert) {
          throw new Error("Fallo simulado al insertar el plan");
        }

        return { rowCount: 1, rows: [planRow] };
      }

      if (sql.includes("INSERT INTO fitness_workout_sessions")) {
        sessionCount++;

        return {
          rowCount: 1,
          rows: [{
            id: String(200 + sessionCount),
            plan_id: "100",
            day_number: sessionCount,
            title: `Entrenamiento ${sessionCount}`,
            estimated_minutes: 45,
            warmup: [],
            exercises: [],
            cooldown: [],
          }],
        };
      }

      throw new Error("Consulta inesperada");
    },
  );

  beforeEach(() => {
    vi.resetAllMocks();

    statements.length = 0;
    sessionCount = 0;
    failOnPlanInsert = false;
    clientExists = true;

    queryMock.mockResolvedValue({
      rows: [profileRow],
    } as never);

    transactionMock.mockImplementation(
      async (callback) =>
        callback({ query: clientQueryMock } as never),
    );
  });

  it("archiva el plan anterior y genera cuatro sesiones", async () => {
    const result = await createFitnessPlan(42);

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(result.sessions).toHaveLength(4);
    expect(sessionCount).toBe(4);

    const lockIndex = statements.findIndex(
      (sql) => sql.includes("FOR UPDATE"),
    );

    const archiveIndex = statements.findIndex(
      (sql) => sql.includes("UPDATE fitness_plans"),
    );

    const insertIndex = statements.findIndex(
      (sql) => sql.includes("INSERT INTO fitness_plans"),
    );

    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(archiveIndex).toBeGreaterThan(lockIndex);
    expect(insertIndex).toBeGreaterThan(archiveIndex);

    expect(statements[archiveIndex]).toContain(
      "status = 'archived'",
    );
  });

  it("rechaza la creacion si el cliente no existe", async () => {
    clientExists = false;

    await expect(createFitnessPlan(42)).rejects.toThrow();

    expect(
      statements.some((sql) =>
        sql.includes("INSERT INTO fitness_plans"),
      ),
    ).toBe(false);
  });

  it("propaga errores al insertar el nuevo plan", async () => {
    failOnPlanInsert = true;

    await expect(createFitnessPlan(42)).rejects.toThrow(
      "Fallo simulado al insertar el plan",
    );

    expect(transactionMock).toHaveBeenCalledOnce();

    expect(
      statements.some((sql) =>
        sql.includes("UPDATE fitness_plans"),
      ),
    ).toBe(true);

    expect(sessionCount).toBe(0);
  });
});