import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { verifyMercadoPagoWebhookSignature } from "../services/mercadopago-webhook.service.js";

const SECRET = "test-webhook-secret";
const PAYMENT_ID = "123456789";
const REQUEST_ID = "test-request-123";

function createSignature(timestamp: number, paymentId = PAYMENT_ID): string {
  const manifest =
    `id:${paymentId.toLowerCase()};` +
    `request-id:${REQUEST_ID};` +
    `ts:${timestamp};`;

  const signature = createHmac("sha256", SECRET).update(manifest).digest("hex");

  return `ts=${timestamp},v1=${signature}`;
}

describe("Mercado Pago - Verificación de webhooks", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("acepta una firma válida", () => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", SECRET);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));

    const timestamp = Date.now();

    const result = verifyMercadoPagoWebhookSignature({
      signatureHeader: createSignature(timestamp),
      requestId: REQUEST_ID,
      dataId: PAYMENT_ID,
    });

    expect(result).toBe(true);
  });

  it("rechaza una firma incorrecta", () => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", SECRET);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));

    const result = verifyMercadoPagoWebhookSignature({
      signatureHeader: `ts=${Date.now()},v1=${"0".repeat(64)}`,
      requestId: REQUEST_ID,
      dataId: PAYMENT_ID,
    });

    expect(result).toBe(false);
  });

  it("rechaza un identificador de pago manipulado", () => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", SECRET);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));

    const result = verifyMercadoPagoWebhookSignature({
      signatureHeader: createSignature(Date.now()),
      requestId: REQUEST_ID,
      dataId: "987654321",
    });

    expect(result).toBe(false);
  });

  it("rechaza una firma sin identificador de solicitud", () => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", SECRET);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));

    const result = verifyMercadoPagoWebhookSignature({
      signatureHeader: createSignature(Date.now()),
      requestId: undefined,
      dataId: PAYMENT_ID,
    });

    expect(result).toBe(false);
  });

  it("rechaza una firma caducada", () => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", SECRET);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));

    const oldTimestamp = Date.now() - 10 * 60 * 1000;

    const result = verifyMercadoPagoWebhookSignature({
      signatureHeader: createSignature(oldTimestamp),
      requestId: REQUEST_ID,
      dataId: PAYMENT_ID,
    });

    expect(result).toBe(false);
  });
});
