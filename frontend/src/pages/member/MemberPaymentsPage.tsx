
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/useAuth";
import type {
  Client,
  ClientMembership,
  MembershipPlan,
  Payment,
} from "../../types/api";
import { useEffect, useState } from "react";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Skeleton from "../../components/Skeleton";
import "@/styles/dashboard/MemberPortal.css";
import {
  useCreateMembershipCheckout,
  useMembershipCheckoutStatus,
} from "../../hooks/useApi";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
  }).format(date);
}

const paymentStatus: Record<string, string> = {
  completed: "Pagado",
  pending: "Pendiente",
  failed: "Fallido",
  refunded: "Reembolsado",
};

export default function MemberPaymentsPage() {
  const { user } = useAuth();

  // Controla qué plan está iniciando una compra.
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Mutación que solicita al backend una orden de Mercado Pago.
  const checkoutMutation = useCreateMembershipCheckout();

  /**
   * Recupera el identificador de la última orden iniciada
   * durante esta sesión del navegador.
   */
  // Recupera el identificador de la última compra guardada en la sesión.
  // Por ahora solo necesitamos leerlo; no modificarlo.
  // Guarda la orden actual y permite actualizarla al iniciar una compra.
  const [checkoutOrderId, setCheckoutOrderId] = useState<number | null>(() => {
    const savedId = sessionStorage.getItem("membershipCheckoutOrderId");
    const parsedId = Number(savedId);

    return savedId && Number.isSafeInteger(parsedId) && parsedId > 0
      ? parsedId
      : null;
  });

  /**
   * Consulta al backend el estado de la compra.
   * Mientras esté pendiente, el hook actualiza la información.
   */
  const checkoutStatusQuery = useMembershipCheckoutStatus(checkoutOrderId);

  // El estado mostrado nunca se obtiene directamente de Mercado Pago.
  const checkoutOrder = checkoutStatusQuery.data?.order;

  /**
   * Prepara la compra y redirige al cliente a Mercado Pago.
   * Nunca confirma ni activa membresías desde el navegador.
   */
  const handlePurchase = async (planId: number) => {
    // Evita iniciar otra compra mientras se procesa una solicitud.
    if (checkoutMutation.isPending) return;

    setSelectedPlanId(planId);

    try {
      const result = await checkoutMutation.mutateAsync(planId);
      const checkoutUrl = result.checkout.checkoutUrl;

      // Solo permite redirigir a una URL HTTPS válida de Mercado Pago.
      const destination = new URL(checkoutUrl);

      const allowedHosts = [
        "mercadopago.com",
        "mercadopago.com.pe",
        "mercadopago.com.ar",
        "mercadopago.com.br",
        "mercadopago.com.mx",
        "mercadopago.cl",
        "mercadopago.com.co",
        "mercadopago.com.uy",
      ];

      const isAllowed = allowedHosts.some(
        (host) =>
          destination.hostname === host ||
          destination.hostname.endsWith(`.${host}`),
      );

      if (destination.protocol !== "https:" || !isAllowed) {
        throw new Error("La dirección de pago no es válida.");
      }

      // Conserva la orden para consultar su estado cuando el cliente regrese.
      sessionStorage.setItem(
        "membershipCheckoutOrderId",
        String(result.order.id),
      );

      // Actualiza el estado de React con la nueva orden.
      // Así podemos consultar su estado sin recargar manualmente.
      setCheckoutOrderId(result.order.id);

      // La redirección abre el checkout alojado por Mercado Pago.
      window.location.assign(destination.toString());
    } catch (error) {
      // Los errores se muestran en la propia pantalla.
      console.error("No se pudo iniciar la compra:", error);
    } finally {
      setSelectedPlanId(null);
    }
  };

  const clientQuery = useQuery<Client>({
    queryKey: ["member-portal", "client", user?.id],
    queryFn: () => api.getClientByUserId(user!.id),
    enabled: !!user?.id,
    retry: false,
  });

  const clientId = clientQuery.data?.id;

  const plansQuery = useQuery<MembershipPlan[]>({
    queryKey: ["member-portal", "plans"],
    queryFn: async () => {
      const result = await api.getMembershipPlans(true);
      return Array.isArray(result) ? result : result.data;
    },
  });

  const membershipsQuery = useQuery<ClientMembership[]>({
    queryKey: ["member-portal", "memberships", clientId],
    queryFn: () => api.getClientMemberships(clientId!),
    enabled: !!clientId,
  });

  const paymentsQuery = useQuery<{ data: Payment[] }>({
    queryKey: ["member-portal", "payments", clientId],
    queryFn: () => api.getClientPayments(clientId!),
    enabled: !!clientId,
  });

  /**
   * Actualiza los datos del cliente cuando el backend confirma
   * que su compra fue aprobada.
   *
   * Las consultas ya están declaradas antes de este efecto.
   */
  useEffect(() => {
    if (checkoutOrder?.status !== "approved") return;

    // Actualiza el historial de membresías y pagos.
    void membershipsQuery.refetch();
    void paymentsQuery.refetch();

    // La actualización se realiza cuando cambia el estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOrder?.status]);

  const today = new Date().toISOString().slice(0, 10);

  const activeMembership = membershipsQuery.data?.find(
    (membership) =>
      membership.status === "active" &&
      membership.startDate.slice(0, 10) <= today &&
      membership.endDate.slice(0, 10) >= today,
  );

  const canPurchase =
    clientQuery.isSuccess && membershipsQuery.isSuccess && !activeMembership;

  return (
    <div className="member-portal">
      <header className="member-portal-header">
        <div>
          <p className="member-eyebrow">MUNDO FITNESS · PORTAL DEL SOCIO</p>
          <h1>Pagos y compras</h1>
          <p>
            Explora nuestros planes, gestiona tus compras y consulta tus pagos.
          </p>
        </div>
      </header>

      {clientQuery.isLoading && (
        <section className="member-card">
          <Skeleton height="80px" />
        </section>
      )}

      {clientQuery.isError && (
        <section className="member-card">
          <Alert type="error" message="No pudimos cargar tu información." />
          <Button
            variant="secondary"
            onClick={() => void clientQuery.refetch()}
          >
            Reintentar
          </Button>
        </section>
      )}

      {clientQuery.data && (
        <>
          {/* Consulta y muestra el resultado de la última compra. */}
          {checkoutOrderId !== null && (
            <section className="member-card">
              <header className="member-section-header">
                <h2>Estado de mi última compra</h2>
              </header>

              {checkoutStatusQuery.isLoading && <Skeleton height="48px" />}

              {checkoutStatusQuery.isError && (
                <>
                  <Alert
                    type="error"
                    message="No pudimos consultar el estado de tu compra."
                  />
                  <Button
                    variant="secondary"
                    onClick={() => void checkoutStatusQuery.refetch()}
                  >
                    Reintentar consulta
                  </Button>
                </>
              )}

              {checkoutOrder && (
                <>
                  <p>
                    Plan: <strong>{checkoutOrder.planName}</strong>
                  </p>

                  <p>
                    Importe:{" "}
                    <strong>
                      {formatMoney(
                        checkoutOrder.amount,
                        checkoutOrder.currency,
                      )}
                    </strong>
                  </p>

                  {/* Solo el backend puede confirmar una compra aprobada. */}
                  {checkoutOrder.status === "approved" && (
                    <Alert
                      type="success"
                      message="¡Pago confirmado! Tu membresía fue activada."
                    />
                  )}

                  {checkoutOrder.status === "pending" && (
                    <>
                      <Alert
                        type="info"
                        message="Tu compra está pendiente. Si todavía no realizaste el pago, puedes continuar en Mercado Pago."
                      />

                      {!activeMembership && (
                        <Button
                          disabled={checkoutMutation.isPending}
                          onClick={() =>
                            void handlePurchase(checkoutOrder.planId)
                          }
                        >
                          {checkoutMutation.isPending &&
                          selectedPlanId === checkoutOrder.planId
                            ? "Preparando pago..."
                            : "Continuar con el pago"}
                        </Button>
                      )}
                    </>
                  )}

                  {checkoutOrder.status === "requires_review" && (
                    <Alert
                      type="warning"
                      message="Recibimos tu pago, pero requiere revisión. No realices otro pago por ahora."
                    />
                  )}

                  {["rejected", "cancelled"].includes(checkoutOrder.status) && (
                    <Alert
                      type="error"
                      message="Esta compra no fue completada."
                    />
                  )}
                </>
              )}
            </section>
          )}

          <section className="member-card">
            <header className="member-section-header">
              <h2>Estado de mi membresía</h2>
            </header>

            {membershipsQuery.isLoading && <Skeleton height="48px" />}

            {membershipsQuery.isError && (
              <>
                <Alert
                  type="error"
                  message="No pudimos verificar tu membresía."
                />
                <Button
                  variant="secondary"
                  onClick={() => void membershipsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </>
            )}

            {activeMembership ? (
              <>
                <p>
                  Tu membresía <strong>{activeMembership.plan?.name}</strong>{" "}
                  está activa hasta el{" "}
                  <strong>{formatDate(activeMembership.endDate)}</strong>.
                </p>
                <p className="member-muted">
                  Ya tienes acceso al gimnasio. Próximamente podrás programar
                  renovaciones anticipadas.
                </p>
                <Link
                  to="/portal/membresia"
                  className="member-dashboard-section-link"
                >
                  Ver mi membresía →
                </Link>
              </>
            ) : (
              membershipsQuery.isSuccess && (
                <p className="member-muted">
                  No tienes una membresía activa. Puedes explorar los planes
                  disponibles.
                </p>
              )
            )}
          </section>

          <section className="member-card">
            <header className="member-section-header">
              <h2>Planes disponibles</h2>
            </header>

            {/* Muestra un error si no se pudo preparar el pago. */}
            {checkoutMutation.isError && (
              <Alert
                type="error"
                message={
                  checkoutMutation.error?.message ||
                  "No pudimos iniciar la compra. Inténtalo nuevamente."
                }
              />
            )}

            <p className="member-muted">
              El catálogo admite nuevos planes y futuras promociones de tiempo
              limitado.
            </p>

            {plansQuery.isLoading && <Skeleton height="120px" />}

            {plansQuery.isError && (
              <>
                <Alert type="error" message="No pudimos cargar los planes." />
                <Button
                  variant="secondary"
                  onClick={() => void plansQuery.refetch()}
                >
                  Reintentar
                </Button>
              </>
            )}

            {plansQuery.isSuccess && plansQuery.data.length === 0 && (
              <p className="member-muted">
                No hay planes disponibles actualmente.
              </p>
            )}

            {!!plansQuery.data?.length && (
              <ul className="member-membership-list">
                {plansQuery.data.map((plan) => (
                  <li key={plan.id}>
                    <strong>{plan.name}</strong>
                    <span>
                      {plan.durationDays} días ·{" "}
                      {formatMoney(plan.price, plan.currency)}
                    </span>
                    <span>{plan.description || "Plan Mundo Fitness"}</span>

                    {/* Permite comprar únicamente si el cliente no tiene membresía activa. */}
                    <Button
                      disabled={!canPurchase || checkoutMutation.isPending}
                      onClick={() => void handlePurchase(plan.id)}
                    >
                      {activeMembership
                        ? "Membresía activa"
                        : checkoutMutation.isPending &&
                            selectedPlanId === plan.id
                          ? "Preparando pago..."
                          : canPurchase
                            ? "Comprar con Mercado Pago"
                            : "Verificando membresía"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* Informa al cliente cómo se confirma realmente su compra. */}
            <p className="member-muted">
              El pago se realizará de forma segura en Mercado Pago. Tu membresía
              se activará cuando nuestro sistema confirme la aprobación del
              pago.
            </p>
          </section>

          <section className="member-card">
            <header className="member-section-header">
              <h2>Historial de pagos</h2>
            </header>

            {paymentsQuery.isLoading && <Skeleton height="80px" />}

            {paymentsQuery.isError && (
              <>
                <Alert type="error" message="No pudimos cargar tus pagos." />
                <Button
                  variant="secondary"
                  onClick={() => void paymentsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </>
            )}

            {paymentsQuery.isSuccess && !paymentsQuery.data.data.length && (
              <p className="member-muted">Aún no tienes pagos registrados.</p>
            )}

            {!!paymentsQuery.data?.data.length && (
              <ul className="member-membership-list">
                {paymentsQuery.data.data.map((payment) => (
                  <li key={payment.id}>
                    <strong>
                      {formatMoney(payment.amount, payment.currency)}
                    </strong>
                    <span>
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </span>
                    <span>
                      {paymentStatus[payment.status] ?? payment.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
