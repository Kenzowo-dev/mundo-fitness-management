
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '@gym/shared/database/index.js';
import { createCheckoutOrder } from '../services/checkout.service.js';
import {
  createMembershipPreference,
  getMembershipPreference,
} from '../services/mercadopago.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const checkoutSchema = z.object({
  planId: z.number().int().positive(),
}).strict();

export async function createCheckoutController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { planId } = checkoutSchema.parse(req.body);
    const userId = Number(req.user?.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(401).json({
        error: { message: 'Usuario no autenticado' },
      });
      return;
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      res.status(503).json({
        error: {
          message: 'Los pagos en línea todavía no están configurados',
          code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
        },
      });
      return;
    }

    const order = await createCheckoutOrder(userId, planId);


if (order.preferenceId) {
  const existingPreference = await getMembershipPreference(
    order.preferenceId
  );

  res.status(200).json({
    message: 'Checkout pendiente recuperado correctamente',
    order: {
      id: order.id,
      planId: order.planId,
      planName: order.planName,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      reference: order.reference,
    },
    checkout: {
      preferenceId: existingPreference.preferenceId,
      checkoutUrl: existingPreference.checkoutUrl,
    },
  });

  return;
}


    const preference = await createMembershipPreference({
      orderId: order.id,
      planId: order.planId,
      planName: order.planName,
      amount: order.amount,
      currency: order.currency,
      reference: order.reference,
    });

    const result = await query(
      `UPDATE membership_checkout_orders
       SET provider_preference_id = $1,
           updated_at = NOW()
       WHERE id = $2
         AND status = 'pending'
         AND provider_preference_id IS NULL
       RETURNING id`,
      [preference.preferenceId, order.id]
    );

    if (!result.rows.length) {
      res.status(409).json({
        error: {
          message: 'La orden cambió de estado durante el checkout',
          code: 'CHECKOUT_ORDER_CONFLICT',
        },
      });
      return;
    }

    res.status(201).json({
      message: 'Checkout preparado correctamente',
      order: {
        id: order.id,
        planId: order.planId,
        planName: order.planName,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        reference: order.reference,
      },
      checkout: {
        preferenceId: preference.preferenceId,
        checkoutUrl: preference.checkoutUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Seguridad: la consulta comprueba c.user_id = $2. Así, un cliente no puede consultar las compras de otro simplemente cambiando el identificador en la URL.
export async function getCheckoutStatusController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = Number(req.user?.sub);
    const orderId = Number(req.params.orderId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(401).json({
        error: { message: "Usuario no autenticado" },
      });
      return;
    }

    if (
      !/^[1-9]\d*$/.test(String(req.params.orderId)) ||
      !Number.isSafeInteger(orderId)
    ) {
      res.status(400).json({
        error: {
          message: "Identificador de orden inválido",
          code: "INVALID_CHECKOUT_ORDER",
        },
      });
      return;
    }

    const result = await query<{
      id: string;
      plan_id: string;
      plan_name: string;
      amount: string;
      currency: string;
      status: string;
      review_reason: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT
         o.id,
         o.plan_id,
         p.name AS plan_name,
         o.amount,
         o.currency,
         o.status,
         o.review_reason,
         o.created_at,
         o.updated_at
       FROM membership_checkout_orders o
       INNER JOIN membership_plans p
         ON p.id = o.plan_id
       INNER JOIN clients c
         ON c.id = o.client_id
       WHERE o.id = $1
         AND c.user_id = $2`,
      [orderId, userId],
    );

    if (!result.rows.length) {
      res.status(404).json({
        error: {
          message: "Orden no encontrada",
          code: "CHECKOUT_ORDER_NOT_FOUND",
        },
      });
      return;
    }

    const order = result.rows[0];

    res.status(200).json({
      order: {
        id: Number(order.id),
        planId: Number(order.plan_id),
        planName: order.plan_name,
        amount: Number(order.amount),
        currency: order.currency,
        status: order.status,
        requiresReview: order.status === "requires_review",
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
}
