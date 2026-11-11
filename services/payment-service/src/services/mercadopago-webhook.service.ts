import { createHmac, timingSafeEqual } from "node:crypto";

export interface MercadoPagoWebhookSignature {
  signatureHeader: string | undefined;
  requestId: string | undefined;
  dataId: string;
}

export function verifyMercadoPagoWebhookSignature(
  input: MercadoPagoWebhookSignature,
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("Falta configurar MERCADOPAGO_WEBHOOK_SECRET");
  }

  if (!input.signatureHeader || !input.requestId || !input.dataId) {
    return false;
  }

  const parts = input.signatureHeader.split(",");

  const signature = parts
    .map((part) => part.trim())
    .find((part) => part.startsWith("v1="))
    ?.slice(3);

  const timestamp = parts
    .map((part) => part.trim())
    .find((part) => part.startsWith("ts="))
    ?.slice(3);

  if (
    !signature ||
    !/^[a-f0-9]{64}$/i.test(signature) ||
    !timestamp ||
    !/^\d+$/.test(timestamp)
  ) {
    return false;
  }

  const timestampValue = Number(timestamp);

  if (!Number.isSafeInteger(timestampValue)) {
    return false;
  }

  const timestampMs =
    timestamp.length === 10 ? timestampValue * 1000 : timestampValue;

  const maximumAgeMs = 5 * 60 * 1000;

  if (Math.abs(Date.now() - timestampMs) > maximumAgeMs) {
    return false;
  }

  const normalizedDataId = input.dataId.trim().toLowerCase();

  if (!normalizedDataId) {
    return false;
  }

  const manifest =
    `id:${normalizedDataId};` +
    `request-id:${input.requestId};` +
    `ts:${timestamp};`;
  const expectedSignature = createHmac("sha256", secret)
    .update(manifest)
    .digest();

  const receivedSignature = Buffer.from(signature, "hex");

  return (
    expectedSignature.length === receivedSignature.length &&
    timingSafeEqual(expectedSignature, receivedSignature)
  );
}
