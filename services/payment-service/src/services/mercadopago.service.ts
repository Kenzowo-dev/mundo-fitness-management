import {
  MercadoPagoConfig,
  Preference,
  Payment,
  MerchantOrder,
} from "mercadopago";

export interface MembershipPreferenceInput {
  orderId: number;
  planId: number;
  planName: string;
  amount: number;
  currency: string;
  reference: string;
}

export interface MembershipPreferenceResult {
  preferenceId: string;
  checkoutUrl: string;
}

function getMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "Mercado Pago no está configurado: falta MERCADOPAGO_ACCESS_TOKEN",
    );
  }

  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000,
    },
  });
}

export async function createMembershipPreference(
  input: MembershipPreferenceInput,
): Promise<MembershipPreferenceResult> {
  if (input.currency !== "PEN") {
    throw new Error("La moneda debe ser PEN");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("El importe debe ser mayor que cero");
  }

  // Obtiene la URL del frontend para regresar después del pago.
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("Falta configurar FRONTEND_URL");
  }

  // Valida el protocolo de la dirección configurada.
  const parsedFrontendUrl = new URL(frontendUrl);

  if (
    parsedFrontendUrl.protocol !== "http:" &&
    parsedFrontendUrl.protocol !== "https:"
  ) {
    throw new Error("FRONTEND_URL debe utilizar HTTP o HTTPS");
  }

  // Ruta existente del portal donde se consulta el estado de compra.
  const paymentsReturnUrl = new URL(
    "/portal/pagos",
    parsedFrontendUrl,
  ).toString();

  const client = getMercadoPagoClient();
  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items: [
        {
          id: String(input.planId),
          title: input.planName,
          quantity: 1,
          unit_price: input.amount,
          currency_id: "PEN",
        },
      ],
      external_reference: input.reference,

      // Mercado Pago redirige al cliente después de intentar pagar.
      // La aprobación definitiva se verifica mediante el webhook.
      back_urls: {
        success: paymentsReturnUrl,
        failure: paymentsReturnUrl,
        pending: paymentsReturnUrl,
      },

      metadata: {
        checkout_order_id: input.orderId,
        plan_id: input.planId,
      },
    },
    requestOptions: {
      idempotencyKey: `membership-preference-${input.orderId}`,
    },
  });

  if (!response.id || !response.init_point) {
    throw new Error("Mercado Pago no devolvió una preferencia válida");
  }

  return {
    preferenceId: response.id,
    checkoutUrl: response.init_point,
  };
}

export async function getMembershipPreference(
  preferenceId: string,
): Promise<MembershipPreferenceResult> {
  if (!preferenceId.trim()) {
    throw new Error("Identificador de preferencia inválido");
  }

  const client = getMercadoPagoClient();
  const preference = new Preference(client);

  const response = await preference.get({
    preferenceId,
  });

  if (!response.id || !response.init_point) {
    throw new Error("No se pudo recuperar la preferencia de Mercado Pago");
  }

  return {
    preferenceId: response.id,
    checkoutUrl: response.init_point,
  };
}

export interface MercadoPagoPaymentDetails {
  id: string;
  status: string;
  externalReference: string;
  amount: number;
  currency: string;
  orderId: number | null;
  collectorId: number | null;
  merchantOrderId: number | null;
}

export async function getMercadoPagoPayment(
  paymentId: string,
): Promise<MercadoPagoPaymentDetails> {
  if (!/^\d+$/.test(paymentId)) {
    throw new Error("Identificador de pago de Mercado Pago inválido");
  }

  const client = getMercadoPagoClient();
  const payment = new Payment(client);

  const response = await payment.get({
    id: paymentId,
  });

  if (
    response.id == null ||
    !response.status ||
    !response.external_reference ||
    response.transaction_amount == null ||
    !response.currency_id
  ) {
    throw new Error("Mercado Pago devolvió información incompleta");
  }

  const rawOrderId = response.metadata?.checkout_order_id;

  const metadataOrderId =
    typeof rawOrderId === "number" || typeof rawOrderId === "string"
      ? Number(rawOrderId)
      : NaN;

  const referenceMatch = /^membership-order-([1-9]\d*)$/.exec(
    response.external_reference,
  );

  const referenceOrderId = referenceMatch ? Number(referenceMatch[1]) : NaN;

  const validMetadataOrderId =
    Number.isSafeInteger(metadataOrderId) && metadataOrderId > 0;

  const validReferenceOrderId =
    Number.isSafeInteger(referenceOrderId) && referenceOrderId > 0;

  if (
    validMetadataOrderId &&
    validReferenceOrderId &&
    metadataOrderId !== referenceOrderId
  ) {
    throw new Error(
      "Los identificadores de orden de Mercado Pago no coinciden",
    );
  }

  const orderId = validMetadataOrderId
    ? metadataOrderId
    : validReferenceOrderId
      ? referenceOrderId
      : null;

  return {
    id: String(response.id),
    status: response.status,
    externalReference: response.external_reference,
    amount: Number(response.transaction_amount),
    currency: response.currency_id,
    orderId,
    collectorId:
      response.collector_id != null ? Number(response.collector_id) : null,
    merchantOrderId:
      response.order?.type === "mercadopago" &&
      Number.isSafeInteger(Number(response.order?.id)) &&
      Number(response.order?.id) > 0
        ? Number(response.order?.id)
        : null,
  };
}

export async function verifyMerchantOrderPayment(
  merchantOrderId: number,
  paymentId: string,
): Promise<string> {
  if (
    !Number.isSafeInteger(merchantOrderId) ||
    merchantOrderId <= 0 ||
    !/^\d+$/.test(paymentId)
  ) {
    throw new Error("Identificadores de orden o pago inválidos");
  }

  const client = getMercadoPagoClient();
  const merchantOrder = new MerchantOrder(client);

  const response = await merchantOrder.get({
    merchantOrderId,
  });

  if (Number(response.id) !== merchantOrderId) {
    throw new Error("La orden comercial no coincide");
  }

  if (!response.preference_id) {
    throw new Error("La orden comercial no tiene preferencia");
  }

  const paymentBelongsToOrder = response.payments?.some(
    (payment) => String(payment.id) === paymentId,
  );

  if (!paymentBelongsToOrder) {
    throw new Error("El pago no pertenece a la orden comercial");
  }

  return response.preference_id;
}
