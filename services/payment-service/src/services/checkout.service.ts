
import { transaction } from '@gym/shared/database/index.js';

export interface CheckoutOrder {
  id: number;
  clientId: number;
  planId: number;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  preferenceId: string | null;
}

export async function createCheckoutOrder(
  userId: number,
  planId: number
): Promise<CheckoutOrder> {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error('Usuario inválido');
  }

  if (!Number.isSafeInteger(planId) || planId <= 0) {
    throw new Error('Plan inválido');
  }

  return transaction(async (client) => {
    const clientResult = await client.query(
      'SELECT id FROM clients WHERE user_id = $1',
      [userId]
    );

    if (!clientResult.rows.length) {
      throw new Error('El usuario no tiene un perfil de cliente');
    }

    const clientId = Number(clientResult.rows[0].id);

    await client.query(
      'SELECT id FROM clients WHERE id = $1 FOR UPDATE',
      [clientId]
    );

    const planResult = await client.query(
      `SELECT id, name, price, currency
       FROM membership_plans
       WHERE id = $1 AND is_active = true`,
      [planId]
    );

    if (!planResult.rows.length) {
      throw new Error('El plan no existe o está inactivo');
    }

    const plan = planResult.rows[0];
    const amount = Number(plan.price);
    const currency = String(plan.currency);
    const planName = String(plan.name);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('El plan tiene un precio inválido');
    }

    if (currency !== 'PEN') {
      throw new Error('El plan debe utilizar soles peruanos');
    }

    const activeMembership = await client.query(
      `SELECT id
       FROM client_memberships
       WHERE client_id = $1
         AND status = 'active'
         AND end_date >= CURRENT_DATE
       LIMIT 1`,
      [clientId]
    );

    if (activeMembership.rows.length) {
      throw new Error('El cliente ya tiene una membresía activa');
    }

    const pendingOrder = await client.query(
      `SELECT id, amount, currency, provider_preference_id
       FROM membership_checkout_orders
       WHERE client_id = $1
         AND plan_id = $2
         AND status = 'pending'
       ORDER BY id DESC
       LIMIT 1`,
      [clientId, planId]
    );

    if (pendingOrder.rows.length) {
      const existing = pendingOrder.rows[0];

      if (
        Number(existing.amount) === amount &&
        String(existing.currency) === currency
      ) {
        const orderId = Number(existing.id);

        return {
          id: orderId,
          clientId,
          planId,
          planName,
          amount,
          currency,
          status: 'pending',
          reference: `membership-order-${orderId}`,
          preferenceId: existing.provider_preference_id ?? null,
        };
      }
    }

    const orderResult = await client.query(
      `INSERT INTO membership_checkout_orders
       (client_id, plan_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [clientId, planId, amount, currency]
    );

    const orderId = Number(orderResult.rows[0].id);

    return {
      id: orderId,
      clientId,
      planId,
      planName,
      amount,
      currency,
      status: 'pending',
      reference: `membership-order-${orderId}`,
      preferenceId: null,
    };
  });
}
