import type { Response, NextFunction } from "express";
import { query } from "@gym/shared/database/index.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  getMercadoPagoPayment,
  verifyMerchantOrderPayment,
} from "../services/mercadopago.service.js";
import { processApprovedCheckoutPayment } from "../services/checkout-payment.service.js";

export async function reconcileCheckoutController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = Number(req.user?.sub);
    const orderId = Number(req.params.orderId);
    const paymentId = req.body?.paymentId;

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      res.status(401).json({ error: "Usuario no autenticado" });
      return;
    }

    if (
      !/^[1-9]\d*$/.test(String(req.params.orderId)) ||
      !Number.isSafeInteger(orderId) ||
      typeof paymentId !== "string" ||
      !/^[1-9]\d*$/.test(paymentId)
    ) {
      res.status(400).json({ error: "Datos invalidos" });
      return;
    }

    const order = await query(
      `SELECT o.id
       FROM membership_checkout_orders o
       INNER JOIN clients c ON c.id = o.client_id
       WHERE o.id = $1 AND c.user_id = $2`,
      [orderId, userId],
    );

    if (!order.rows.length) {
      res.status(404).json({ error: "Orden no encontrada" });
      return;
    }

    const expectedCollectorId = Number(
      process.env.MERCADOPAGO_COLLECTOR_ID,
    );

    if (
      !Number.isSafeInteger(expectedCollectorId) ||
      expectedCollectorId <= 0
    ) {
      res.status(503).json({ error: "Proveedor no configurado" });
      return;
    }

    const payment = await getMercadoPagoPayment(paymentId);

    if (
      payment.id !== paymentId ||
      payment.collectorId !== expectedCollectorId ||
      payment.status !== "approved" ||
      payment.orderId !== orderId ||
      payment.merchantOrderId === null
    ) {
      res.status(422).json({
        error: "El pago no cumple las verificaciones",
      });
      return;
    }

    const verifiedPreferenceId =
      await verifyMerchantOrderPayment(
        payment.merchantOrderId,
        payment.id,
      );

    const result = await processApprovedCheckoutPayment({
      orderId,
      providerPaymentId: payment.id,
      externalReference: payment.externalReference,
      status: "approved",
      amount: payment.amount,
      currency: payment.currency,
      verifiedPreferenceId,
    });

    res.status(200).json({
      message: "Conciliacion completada",
      result,
    });
  } catch (error) {
    next(error);
  }
}
