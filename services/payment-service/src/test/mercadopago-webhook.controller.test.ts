import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("../services/mercadopago.service.js", () => ({
  getMercadoPagoPayment: vi.fn(),
  verifyMerchantOrderPayment: vi.fn(),
}));

vi.mock("../services/mercadopago-webhook.service.js", () => ({
  verifyMercadoPagoWebhookSignature: vi.fn(() => true),
}));

vi.mock("../services/checkout-payment.service.js", () => ({
  processApprovedCheckoutPayment: vi.fn(),
}));

import { mercadoPagoWebhookController } from "../controllers/mercadopago-webhook.controller.js";
import { getMercadoPagoPayment } from "../services/mercadopago.service.js";
import { processApprovedCheckoutPayment } from "../services/checkout-payment.service.js";

describe("Mercado Pago - controlador webhook", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("responde 404 cuando Mercado Pago no encuentra el pago", async () => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "test-token");
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "test-secret");
    vi.stubEnv("MERCADOPAGO_COLLECTOR_ID", "12345");

    const error = Object.assign(new Error("Payment not found"), {
      status: 404,
    });

    vi.mocked(getMercadoPagoPayment).mockRejectedValueOnce(error);

    const req = {
      query: { "data.id": "123456789" },
      body: {
        type: "payment",
        data: { id: "123456789" },
      },
      get: vi.fn((header: string) => {
        if (header === "x-signature") return "test-signature";
        if (header === "x-request-id") return "test-request";
        return undefined;
      }),
    } as unknown as Request;

    const json = vi.fn();
    const status = vi.fn();

    const res = {
      status,
      json,
    } as unknown as Response;

    status.mockReturnValue(res);

    const next = vi.fn() as NextFunction;

    await mercadoPagoWebhookController(req, res, next);

    expect(status).toHaveBeenCalledWith(404);

    expect(json).toHaveBeenCalledWith({
      error: {
        message: "Pago no encontrado en Mercado Pago",
        code: "MERCADOPAGO_PAYMENT_NOT_FOUND",
      },
    });

    expect(processApprovedCheckoutPayment).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
