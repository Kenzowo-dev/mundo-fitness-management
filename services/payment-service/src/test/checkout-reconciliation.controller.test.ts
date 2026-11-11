import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const { queryMock, getPaymentMock, verifyOrderMock, processMock } =
  vi.hoisted(() => ({
    queryMock: vi.fn(),
    getPaymentMock: vi.fn(),
    verifyOrderMock: vi.fn(),
    processMock: vi.fn(),
  }));

vi.mock("@gym/shared/database/index.js", () => ({
  query: queryMock,
}));

vi.mock("../services/mercadopago.service.js", () => ({
  getMercadoPagoPayment: getPaymentMock,
  verifyMerchantOrderPayment: verifyOrderMock,
}));

vi.mock("../services/checkout-payment.service.js", () => ({
  processApprovedCheckoutPayment: processMock,
}));

import { reconcileCheckoutController } from "../controllers/checkout-reconciliation.controller.js";

const validPayment = {
  id: "188008368445",
  collectorId: 2999457909,
  status: "approved",
  orderId: 4,
  merchantOrderId: 46054975416,
  externalReference: "membership-order-4",
  amount: 5,
  currency: "PEN",
};

async function execute(
  userId = "10",
  orderId = "4",
  paymentId: unknown = "188008368445",
) {
  const req = {
    user: { sub: userId, role: "member" },
    params: { orderId },
    body: { paymentId },
  } as unknown as AuthenticatedRequest;

  const json = vi.fn();
  const status = vi.fn();

  const res = { status, json } as unknown as Response;
  status.mockReturnValue(res);

  const next = vi.fn() as NextFunction;

  await reconcileCheckoutController(req, res, next);

  return { status, json, next };
}

describe("Conciliacion de pagos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MERCADOPAGO_COLLECTOR_ID", "2999457909");

    queryMock.mockResolvedValue({ rows: [{ id: 4 }] });
    getPaymentMock.mockResolvedValue(validPayment);
    verifyOrderMock.mockResolvedValue("preference-123");
    processMock.mockResolvedValue({
      orderId: 4,
      paymentId: 61,
      membershipId: 68,
      alreadyProcessed: false,
      requiresReview: false,
    });
  });

  it("procesa un pago aprobado y verificado", async () => {
    const { status, next } = await execute();

    expect(status).toHaveBeenCalledWith(200);
    expect(verifyOrderMock).toHaveBeenCalledWith(
      46054975416,
      "188008368445",
    );
    expect(processMock).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it("rechaza una orden que no pertenece al cliente", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const { status } = await execute();

    expect(status).toHaveBeenCalledWith(404);
    expect(getPaymentMock).not.toHaveBeenCalled();
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rechaza identificadores invalidos", async () => {
    const { status } = await execute("10", "4", "pago-falso");

    expect(status).toHaveBeenCalledWith(400);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rechaza pagos de otro receptor", async () => {
    getPaymentMock.mockResolvedValueOnce({
      ...validPayment,
      collectorId: 999,
    });

    const { status } = await execute();

    expect(status).toHaveBeenCalledWith(422);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rechaza pagos no aprobados", async () => {
    getPaymentMock.mockResolvedValueOnce({
      ...validPayment,
      status: "rejected",
    });

    const { status } = await execute();

    expect(status).toHaveBeenCalledWith(422);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("rechaza pagos de otra orden", async () => {
    getPaymentMock.mockResolvedValueOnce({
      ...validPayment,
      orderId: 99,
    });

    const { status } = await execute();

    expect(status).toHaveBeenCalledWith(422);
    expect(processMock).not.toHaveBeenCalled();
  });

  it("propaga errores del procesamiento sin aprobar falsamente", async () => {
    const error = new Error("Conflicto de pago");
    processMock.mockRejectedValueOnce(error);

    const { next, status } = await execute();

    expect(next).toHaveBeenCalledWith(error);
    expect(status).not.toHaveBeenCalledWith(200);
  });
});
