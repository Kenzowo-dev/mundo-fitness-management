import { beforeEach, describe, expect, it, vi } from "vitest";

const { query, transaction } = vi.hoisted(() => {
  const query = vi.fn();
  const transaction = vi.fn(
    (callback: (client: { query: typeof query }) => Promise<unknown>) =>
      callback({ query }),
  );

  return { query, transaction };
});

vi.mock("@gym/shared/database/index.js", () => ({
  transaction,
}));

import { processApprovedCheckoutPayment } from "../services/checkout-payment.service.js";

const verifiedPayment = {
  orderId: 10,
  providerPaymentId: "987654321",
  externalReference: "membership-order-10",
  status: "approved" as const,
  amount: 149.9,
  currency: "PEN",
  verifiedPreferenceId: "preference-123",
};

const pendingOrder = {
  id: 10,
  client_id: 22,
  plan_id: 3,
  payment_id: null,
  provider_preference_id: "preference-123",
  provider_payment_id: null,
  amount: "149.90",
  currency: "PEN",
  status: "pending",
};

describe("Mercado Pago - Procesamiento de compras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.mockReset();
  });

  it("crea una membresía y registra el pago aprobado", async () => {
    query
      .mockResolvedValueOnce({ rows: [pendingOrder] })
      .mockResolvedValueOnce({ rows: [{ id: 22 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ duration_days: 30, name: "Plan mensual" }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 71 }] })
      .mockResolvedValueOnce({ rows: [{ id: 501 }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const result = await processApprovedCheckoutPayment(verifiedPayment);

    expect(result).toEqual({
      orderId: 10,
      paymentId: 501,
      membershipId: 71,
      alreadyProcessed: false,
      requiresReview: false,
    });

    expect(transaction).toHaveBeenCalledOnce();

    const sqlStatements = query.mock.calls.map((call) => String(call[0]));

    expect(
      sqlStatements.filter((sql: string) =>
        sql.includes("INSERT INTO client_memberships"),
      ),
    ).toHaveLength(1);

    expect(
      sqlStatements.filter((sql: string) =>
        sql.includes("INSERT INTO payments"),
      ),
    ).toHaveLength(1);
  });

  it("no duplica una compra que ya fue procesada", async () => {
    query
      .mockResolvedValueOnce({
        rows: [
          {
            ...pendingOrder,
            status: "approved",
            payment_id: 501,
            provider_payment_id: "987654321",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ membership_id: 71 }],
      });

    const result = await processApprovedCheckoutPayment(verifiedPayment);

    expect(result).toEqual({
      orderId: 10,
      paymentId: 501,
      membershipId: 71,
      alreadyProcessed: true,
      requiresReview: false,
    });

    expect(query).toHaveBeenCalledTimes(2);
  });

  it("rechaza un importe que no coincide con la orden", async () => {
    query.mockResolvedValueOnce({
      rows: [pendingOrder],
    });

    await expect(
      processApprovedCheckoutPayment({
        ...verifiedPayment,
        amount: 99.9,
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });

    expect(query).toHaveBeenCalledTimes(1);
  });

  it("rechaza una referencia externa incorrecta", async () => {
    query.mockResolvedValueOnce({
      rows: [pendingOrder],
    });

    await expect(
      processApprovedCheckoutPayment({
        ...verifiedPayment,
        externalReference: "membership-order-999",
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });

    expect(query).toHaveBeenCalledTimes(1);
  });
  it("rechaza un pago con una preferencia incorrecta", async () => {
    query.mockResolvedValueOnce({
      rows: [pendingOrder],
    });

    await expect(
      processApprovedCheckoutPayment({
        ...verifiedPayment,
        verifiedPreferenceId: "preferencia-falsa",
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });

    expect(query).toHaveBeenCalledTimes(1);

    const sqlStatements = query.mock.calls.map((call) => String(call[0]));

    expect(
      sqlStatements.some((sql) =>
        sql.includes("INSERT INTO client_memberships"),
      ),
    ).toBe(false);

    expect(
      sqlStatements.some((sql) => sql.includes("INSERT INTO payments")),
    ).toBe(false);
  });

it("registra un pago para revisión si existe una membresía activa", async () => {
  query
    .mockResolvedValueOnce({ rows: [pendingOrder] })
    .mockResolvedValueOnce({ rows: [{ id: 22 }] })
    .mockResolvedValueOnce({ rows: [{ id: 88 }] })
    .mockResolvedValueOnce({ rows: [{ id: 502 }] })
    .mockResolvedValueOnce({ rowCount: 1 });

  const result = await processApprovedCheckoutPayment(verifiedPayment);

  expect(result).toEqual({
    orderId: 10,
    paymentId: 502,
    membershipId: null,
    alreadyProcessed: false,
    requiresReview: true,
  });

  const statements = query.mock.calls.map((call) => String(call[0]));

  expect(
    statements.some((sql) => sql.includes("INSERT INTO client_memberships")),
  ).toBe(false);

  expect(statements.some((sql) => sql.includes("INSERT INTO payments"))).toBe(
    true,
  );

  expect(statements.some((sql) => sql.includes("requires_review"))).toBe(true);
});

it("no duplica un pago que ya está pendiente de revisión", async () => {
  query
    .mockResolvedValueOnce({
      rows: [
        {
          ...pendingOrder,
          status: "requires_review",
          payment_id: 502,
          provider_payment_id: "987654321",
        },
      ],
    })
    .mockResolvedValueOnce({
      rows: [{ membership_id: null }],
    });

  const result = await processApprovedCheckoutPayment(verifiedPayment);

  expect(result).toEqual({
    orderId: 10,
    paymentId: 502,
    membershipId: null,
    alreadyProcessed: true,
    requiresReview: true,
  });

  expect(query).toHaveBeenCalledTimes(2);
});

});
