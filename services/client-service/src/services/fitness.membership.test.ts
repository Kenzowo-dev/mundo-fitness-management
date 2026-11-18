import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@gym/shared/database/index.js", () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

import { query } from "@gym/shared/database/index.js";
import { requireActiveFitnessMembership } from "./fitness.service.js";

const queryMock = vi.mocked(query);

describe("Fitness membership authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("permite continuar cuando existe una membresia vigente", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ has_membership: true }],
    } as never);

    await expect(
      requireActiveFitnessMembership(42),
    ).resolves.toBeUndefined();

    expect(queryMock).toHaveBeenCalledOnce();
    expect(queryMock.mock.calls[0]?.[1]).toEqual([42]);
  });

  it("rechaza a un cliente sin membresia vigente", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ has_membership: false }],
    } as never);

    await expect(
      requireActiveFitnessMembership(42),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "ACTIVE_MEMBERSHIP_REQUIRED",
    });
  });

  it("comprueba estado y fechas de vigencia", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ has_membership: true }],
    } as never);

    await requireActiveFitnessMembership(42);

    const sql = String(queryMock.mock.calls[0]?.[0]);

    expect(sql).toContain("status = 'active'");
    expect(sql).toContain("start_date <= CURRENT_DATE");
    expect(sql).toContain("end_date >= CURRENT_DATE");
    expect(sql).toContain("client_id = $1");
  });

  it("rechaza cuando la consulta no encuentra registros", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [],
    } as never);

    await expect(
      requireActiveFitnessMembership(42),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "ACTIVE_MEMBERSHIP_REQUIRED",
    });
  });
});
