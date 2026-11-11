import type { Request, Response, NextFunction } from "express";
import {
  getMercadoPagoPayment,
  verifyMerchantOrderPayment,
} from "../services/mercadopago.service.js";
import { verifyMercadoPagoWebhookSignature } from "../services/mercadopago-webhook.service.js";
import { processApprovedCheckoutPayment } from "../services/checkout-payment.service.js";

export async function mercadoPagoWebhookController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (
      !process.env.MERCADOPAGO_ACCESS_TOKEN ||
      !process.env.MERCADOPAGO_WEBHOOK_SECRET
    ) {
      res.status(503).json({
        error: {
          message: "Proveedor de pagos no configurado",
          code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
        },
      });
      return;
    }

    const rawPaymentId = req.query["data.id"];

    const paymentId = typeof rawPaymentId === "string" ? rawPaymentId : "";

    if (!/^\d+$/.test(paymentId)) {
      res.status(400).json({
        error: {
          message: "Identificador de pago inválido",
          code: "INVALID_PAYMENT_ID",
        },
      });
      return;
    }

    const signatureHeader = req.get("x-signature");
    const requestId = req.get("x-request-id");

    const signatureValid = verifyMercadoPagoWebhookSignature({
      signatureHeader,
      requestId,
      dataId: paymentId,
    });


    if (!signatureValid) {
      res.status(401).json({
        error: {
          message: "Firma de webhook inválida",
          code: "INVALID_WEBHOOK_SIGNATURE",
        },
      });
      return;
    }

    const eventType = req.body?.type ?? req.body?.topic;

    if (eventType !== "payment") {
      res.status(200).json({
        received: true,
        processed: false,
      });
      return;
    }

    const bodyPaymentId = req.body?.data?.id;

    if (bodyPaymentId == null || String(bodyPaymentId) !== paymentId) {
      res.status(400).json({
        error: {
          message: "Identificadores de pago inconsistentes",
          code: "PAYMENT_ID_MISMATCH",
        },
      });
      return;
    }

    const rawCollectorId = process.env.MERCADOPAGO_COLLECTOR_ID;

    const expectedCollectorId = rawCollectorId ? Number(rawCollectorId) : NaN;

    if (
      !Number.isSafeInteger(expectedCollectorId) ||
      expectedCollectorId <= 0
    ) {
      res.status(503).json({
        error: {
          message: "La cuenta receptora de Mercado Pago no está configurada",
          code: "MERCADOPAGO_COLLECTOR_NOT_CONFIGURED",
        },
      });
      return;
    }

    let payment;

    try {
      payment = await getMercadoPagoPayment(paymentId);
    } catch (error) {
      if (
        error instanceof Error &&
        "status" in error &&
        error.status === 404
      ) {
        res.status(404).json({
          error: {
            message: "Pago no encontrado en Mercado Pago",
            code: "MERCADOPAGO_PAYMENT_NOT_FOUND",
          },
        });
        return;
      }

      throw error;
    }

    if (payment.collectorId !== expectedCollectorId) {
      res.status(422).json({
        error: {
          message: "El pago no pertenece a la cuenta configurada",
          code: "INVALID_PAYMENT_COLLECTOR",
        },
      });
      return;
    }

    if (payment.id !== paymentId) {
      res.status(400).json({
        error: {
          message: "El identificador del pago no coincide",
          code: "PAYMENT_ID_MISMATCH",
        },
      });
      return;
    }

    if (payment.status !== "approved") {
      res.status(200).json({
        received: true,
        processed: false,
      });
      return;
    }

    if (payment.orderId === null) {
      res.status(422).json({
        error: {
          message: "El pago no tiene una orden válida",
          code: "CHECKOUT_ORDER_MISSING",
        },
      });
      return;
    }

    if (payment.merchantOrderId === null) {
      res.status(422).json({
        error: {
          message: "El pago no tiene una orden comercial verificable",
          code: "MISSING_MERCHANT_ORDER",
        },
      });
      return;
    }

    const verifiedPreferenceId = await verifyMerchantOrderPayment(
      payment.merchantOrderId,
      payment.id,
    );

    await processApprovedCheckoutPayment({
      orderId: payment.orderId,
      providerPaymentId: payment.id,
      externalReference: payment.externalReference,
      status: "approved",
      amount: payment.amount,
      currency: payment.currency,
      verifiedPreferenceId,
    });

    // Confirma la recepción sin exponer identificadores internos.
    res.status(200).json({
      received: true,
      processed: true,
    });
  } catch (error) {
    next(error);
  }
}

// Recarga de credenciales Mercado Pago
