import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.hoisted(() => vi.fn());

vi.mock("@gym/shared/database/index.js", () => ({
  query: queryMock,
}));

import {
  updateGoal,
  deleteGoal,
} from "../src/services/client.service.js";

describe("Seguridad de objetivos fitness", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("incluye el propietario al actualizar un objetivo", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    await expect(
      updateGoal(
        10,
        { description: "Nueva descripción" },
        5
      )
    ).rejects.toThrow();

    const [sql, params] = queryMock.mock.calls[0];

    expect(sql).toMatch(/WHERE id = \$2 AND client_id = \$3/);
    expect(params).toEqual([
      "Nueva descripción",
      10,
      5,
    ]);
  });

  it("impide eliminar objetivos de otro cliente", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    await expect(
      deleteGoal(10, 99)
    ).rejects.toThrow();

    expect(queryMock).toHaveBeenCalledWith(
      "DELETE FROM client_goals WHERE id = $1 AND client_id = $2",
      [10, 99]
    );
  });

  it("permite eliminar un objetivo propio", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
    });

    await expect(
      deleteGoal(10, 5)
    ).resolves.toBeUndefined();

    expect(queryMock).toHaveBeenCalledWith(
      "DELETE FROM client_goals WHERE id = $1 AND client_id = $2",
      [10, 5]
    );
  });

  it("no marca automáticamente una meta numérica como lograda", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    await expect(
      updateGoal(
        10,
        { currentValue: 85, targetValue: 78 },
        5
      )
    ).rejects.toThrow();

    const [sql] = queryMock.mock.calls[0];

    expect(sql).not.toContain("achieved_at = NOW()");
  });

  it("marca como logrado cuando el estado es achieved", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    await expect(
      updateGoal(10, { status: "achieved" }, 5)
    ).rejects.toThrow();

    const [sql] = queryMock.mock.calls[0];

    expect(sql).toContain("achieved_at = NOW()");
  });
});
