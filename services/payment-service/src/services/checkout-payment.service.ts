import { transaction } from "@gym/shared/database/index.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@gym/shared/errors/index.js";

export interface VerifiedCheckoutPayment {
  orderId: number;
  providerPaymentId: string;
  externalReference: string;
  status: "approved";
  amount: number;
  currency: string;
  verifiedPreferenceId: string;
}

export interface CheckoutPaymentResult {
  orderId: number;
  paymentId: number;
  membershipId: number | null;
  alreadyProcessed: boolean;
  requiresReview: boolean;
}

interface CheckoutOrderRow {
  id: number;
  client_id: number;
  plan_id: number;
  payment_id: number | null;
  provider_preference_id: string | null;
  provider_payment_id: string | null;
  amount: string | number;
  currency: string;
  status: string;
}


async function registerPaymentForReview(
  client: import("pg").PoolClient,
  order: CheckoutOrderRow,
  verified: VerifiedCheckoutPayment,
  reason: string,
): Promise<CheckoutPaymentResult> {
  const paymentResult = await client.query<{ id: number }>(
    `INSERT INTO payments (
       client_id,
       membership_id,
       amount,
       currency,
       status,
       payment_method,
       transaction_id,
       description,
       paid_at,
       metadata
     )
     VALUES (
       $1, NULL, $2, $3,
       'completed', 'mercadopago',
       $4, $5, NOW(), $6::jsonb
     )
     RETURNING id`,
    [
      order.client_id,
      order.amount,
      order.currency,
      verified.providerPaymentId,
      "Pago de membresía pendiente de revisión",
      JSON.stringify({
        checkoutOrderId: order.id,
        provider: "mercadopago",
        preferenceId: order.provider_preference_id,
        requiresReview: true,
        reviewReason: reason,
      }),
    ],
  );

  const paymentId = Number(paymentResult.rows[0].id);

  await client.query(
    `UPDATE membership_checkout_orders
     SET status = 'requires_review',
         payment_id = $1,
         provider_payment_id = $2,
         review_reason = $3,
         review_requested_at = NOW(),
         updated_at = NOW()
     WHERE id = $4`,
    [paymentId, verified.providerPaymentId, reason, order.id],
  );

  return {
    orderId: order.id,
    paymentId,
    membershipId: null,
    alreadyProcessed: false,
    requiresReview: true,
  };
}


export async function processApprovedCheckoutPayment(
  verified: VerifiedCheckoutPayment,
): Promise<CheckoutPaymentResult> {
  if (!Number.isSafeInteger(verified.orderId) || verified.orderId <= 0) {
    throw new ValidationError("Orden inválida");
  }

  if (!/^\d+$/.test(verified.providerPaymentId)) {
    throw new ValidationError("Referencia de pago inválida");
  }

  if (
    verified.status !== "approved" ||
    !Number.isFinite(verified.amount) ||
    verified.amount <= 0 ||
    verified.currency !== "PEN"
  ) {
    throw new ValidationError("Pago no aprobado o inválido");
  }

  return transaction(async (client) => {
    const orderResult = await client.query<CheckoutOrderRow>(
      `SELECT *
       FROM membership_checkout_orders
       WHERE id = $1
       FOR UPDATE`,
      [verified.orderId],
    );

    if (!orderResult.rows.length) {
      throw new NotFoundError("MembershipCheckoutOrder", verified.orderId);
    }

    const order = orderResult.rows[0];

    if (verified.externalReference !== `membership-order-${order.id}`) {
      throw new ValidationError("La referencia no corresponde a la orden");
    }

    if (!order.provider_preference_id) {
      throw new ValidationError("La orden no tiene una preferencia registrada");
    }
    if (order.provider_preference_id !== verified.verifiedPreferenceId) {
      throw new ValidationError(
        "La preferencia del pago no corresponde a la orden",
      );
    }

    if (
      Number(order.amount) !== verified.amount ||
      order.currency !== verified.currency
    ) {
      throw new ValidationError("El importe o la moneda no coincide");
    }

    if (order.status === "approved") {
      if (
        order.provider_payment_id !== verified.providerPaymentId ||
        !order.payment_id
      ) {
        throw new ConflictError("La orden ya fue procesada con otro pago");
      }

      const existingPayment = await client.query<{
        membership_id: number | null;
      }>(
        `SELECT membership_id
         FROM payments
         WHERE id = $1`,
        [order.payment_id],
      );

      const membershipId = existingPayment.rows[0]?.membership_id;

      if (!membershipId) {
        throw new ConflictError(
          "La orden aprobada no tiene una membresía asociada",
        );
      }

      return {
        orderId: order.id,
        paymentId: Number(order.payment_id),
        membershipId: Number(membershipId),
        alreadyProcessed: true,
        requiresReview: false,
      };
    }


if (order.status === "requires_review") {
  if (
    order.provider_payment_id !== verified.providerPaymentId ||
    !order.payment_id
  ) {
    throw new ConflictError("La orden está en revisión por otro pago");
  }

  const existingPayment = await client.query<{
    membership_id: number | null;
  }>(
    `SELECT membership_id
     FROM payments
     WHERE id = $1`,
    [order.payment_id],
  );

  if (!existingPayment.rows.length) {
    throw new ConflictError(
      "No se encontró el pago asociado a la orden en revisión",
    );
  }

  return {
    orderId: order.id,
    paymentId: Number(order.payment_id),
    membershipId: existingPayment.rows[0].membership_id,
    alreadyProcessed: true,
    requiresReview: true,
  };
}


    if (order.status !== "pending") {
      throw new ConflictError("La orden ya no está pendiente");
    }

    // Bloqueamos el cliente para evitar activaciones simultáneas
    // de diferentes órdenes.
    await client.query("SELECT id FROM clients WHERE id = $1 FOR UPDATE", [
      order.client_id,
    ]);

    const activeMembership = await client.query(
      `SELECT id
       FROM client_memberships
       WHERE client_id = $1
         AND status = 'active'
         AND end_date >= CURRENT_DATE
       LIMIT 1`,
      [order.client_id],
    );

    if (activeMembership.rows.length) {
      return registerPaymentForReview(
        client,
        order,
        verified,
        "El cliente ya tiene una membresía activa",
      );
    }

    const planResult = await client.query<{
      duration_days: number;
      name: string;
    }>(
      `SELECT duration_days, name
       FROM membership_plans
       WHERE id = $1`,
      [order.plan_id],
    );

    if (!planResult.rows.length) {
      throw new NotFoundError("MembershipPlan", order.plan_id);
    }

    const plan = planResult.rows[0];

    if (!Number.isSafeInteger(plan.duration_days) || plan.duration_days <= 0) {
      throw new ValidationError("El plan tiene una duración inválida");
    }

    const membershipResult = await client.query<{
      id: number;
    }>(
      `INSERT INTO client_memberships
       (client_id, plan_id, start_date, end_date, auto_renew)
       VALUES (
         $1,
         $2,
         CURRENT_DATE,
         CURRENT_DATE + $3::integer,
         false
       )
       RETURNING id`,
      [order.client_id, order.plan_id, plan.duration_days],
    );

    const membershipId = Number(membershipResult.rows[0].id);

    const paymentResult = await client.query<{
      id: number;
    }>(
      `INSERT INTO payments
       (
         client_id,
         membership_id,
         amount,
         currency,
         status,
         payment_method,
         transaction_id,
         description,
         paid_at,
         metadata
       )
       VALUES (
         $1, $2, $3, $4,
         'completed',
         'mercadopago',
         $5, $6, NOW(),
         $7::jsonb
       )
       RETURNING id`,
      [
        order.client_id,
        membershipId,
        order.amount,
        order.currency,
        verified.providerPaymentId,
        `Compra de membresía: ${plan.name}`,
        JSON.stringify({
          checkoutOrderId: order.id,
          provider: "mercadopago",
          preferenceId: order.provider_preference_id,
        }),
      ],
    );

    const paymentId = Number(paymentResult.rows[0].id);

    await client.query(
      `UPDATE membership_checkout_orders
       SET status = 'approved',
           payment_id = $1,
           provider_payment_id = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [paymentId, verified.providerPaymentId, order.id],
    );

    return {
      orderId: order.id,
      paymentId,
      membershipId,
      alreadyProcessed: false,
      requiresReview: false,
    };
  });
}
