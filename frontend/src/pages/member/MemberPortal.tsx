import MembershipSummary, { type MembershipSummaryState } from '../../components/MembershipSummary';
import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { selectedPlanId } from "../../utils/planSelection";
import { api } from "../../api/client";
import { useAuth } from "../../context/useAuth";
import {
  useCreateMembershipRenewalRequest,
  useMyMembershipRenewalRequests,
  useOwnMeasurements,
  useOwnGoals,
} from "../../hooks/useApi";
import type {
  Client,
  ClientMembership,
  MembershipPlan,
  Payment,
} from "../../types/api";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import FormField from "../../components/FormField";
import Skeleton from "../../components/Skeleton";
import "@/styles/dashboard/MemberPortal.css";

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(parsed);
}

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

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Activa",
    expired: "Vencida",
    cancelled: "Cancelada",
    completed: "Pagado",
    pending: "Pendiente",
    failed: "Fallido",
    refunded: "Reembolsado",
    contacted: "En atención",
    closed: "Cerrada",
  };
  return labels[status] ?? status;
}

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="member-skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height="44px" />
      ))}
    </div>
  );
}

function PortalSection({
  id,
  title,
  children,
  action,
}: {
  id: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="member-card" aria-labelledby={id}>
      <header className="member-section-header">
        <h2 id={id}>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export default function MemberPortal() {
  const { user } = useAuth();
  const location = useLocation();
  const [renewalPlanId, setRenewalPlanId] = useState(() =>
    selectedPlanId(location.search),
  );
  const [renewalNote, setRenewalNote] = useState("");
  const [renewalMessage, setRenewalMessage] = useState<string | null>(null);
  const [renewalError, setRenewalError] = useState<string | null>(null);

  const clientQuery = useQuery<Client>({
    queryKey: ["member-portal", "client", user?.id],
    queryFn: () => api.getClientByUserId(user!.id),
    enabled: !!user?.id,
    retry: false,
  });
  const clientId = clientQuery.data?.id;
  const measurementsQuery = useOwnMeasurements();
  const goalsQuery = useOwnGoals();

const activeGoalsCount = (goalsQuery.data ?? []).filter(
  (goal) => goal.status === "in_progress"
).length;

const completedGoalsCount = (goalsQuery.data ?? []).filter(
  (goal) => goal.status === "achieved"
).length;
  const membershipsQuery = useQuery<ClientMembership[]>({
    queryKey: ["member-portal", "memberships", clientId],
    queryFn: () => api.getClientMemberships(clientId!),
    enabled: !!clientId,
  });
  const plansQuery = useQuery<MembershipPlan[]>({
    queryKey: ["member-portal", "plans"],
    queryFn: async () => {
  const result = await api.getMembershipPlans(true);
  return Array.isArray(result) ? result : result.data;
},
  });
  const renewalRequestsQuery = useMyMembershipRenewalRequests();
  const createRenewalRequest = useCreateMembershipRenewalRequest();
  const paymentsQuery = useQuery<{ data: Payment[] }>({
    queryKey: ["member-portal", "payments", clientId],
    queryFn: () => api.getClientPayments(clientId!),
    enabled: !!clientId,
  });

  const selectedRenewalPlan = plansQuery.data?.find(plan => String(plan.id) === renewalPlanId);
  const validRenewalPlanId = selectedRenewalPlan ? String(selectedRenewalPlan.id) : '';
  const requestedPlanId = selectedPlanId(location.search);
  const requestedPlanUnavailable = plansQuery.isSuccess && requestedPlanId && !plansQuery.data.some(plan => String(plan.id) === requestedPlanId);
  const today = new Date().toISOString().slice(0, 10);
  const activeMembership = membershipsQuery.data?.find(
    (membership) =>
      membership.status === "active" &&
      membership.startDate.slice(0, 10) <= today &&
      membership.endDate.slice(0, 10) >= today,
  );
  const membershipSummary: MembershipSummaryState = membershipsQuery.isLoading
    ? { kind: 'loading' }
    : membershipsQuery.isError
      ? { kind: 'unavailable', retry: () => void membershipsQuery.refetch() }
      : activeMembership
        ? { kind: 'active', planName: activeMembership.plan?.name ?? 'Tu membresía', validUntil: formatDate(activeMembership.endDate) }
        : { kind: 'inactive' };
  const openRenewalRequest = renewalRequestsQuery.data?.find(
    (request) => request.status !== "closed",
  );

  const submitRenewalRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRenewalError(null);
    setRenewalMessage(null);
    if (!selectedRenewalPlan) {
      setRenewalError("Selecciona un plan para continuar.");
      return;
    }
    try {
      await createRenewalRequest.mutateAsync({
        planId: selectedRenewalPlan.id,
        memberNote: renewalNote.trim() || undefined,
      });
      setRenewalPlanId("");
      setRenewalNote("");
      setRenewalMessage(
        "Solicitud enviada. Recepción se pondrá en contacto contigo.",
      );
    } catch {
      setRenewalError(
        "No pudimos enviar la solicitud. Comprueba tu conexión e inténtalo de nuevo.",
      );
    }
  };

  return (
  <div className="member-portal">
    <header className="member-portal-header">
      <div>
        <p className="member-eyebrow">
          MUNDO FITNESS · PORTAL DEL SOCIO
        </p>

        <h1>Hola, {user?.firstName}</h1>

        <p>
          Hoy también cuenta. Tu membresía y tus próximos pasos,
          en un solo lugar.
        </p>
      </div>
    </header>

    {clientQuery.isLoading && (
        <section
          className="member-card"
          aria-label="Cargando tu perfil"
          aria-busy="true"
        >
          <SectionSkeleton rows={3} />
        </section>
      )}
      {clientQuery.isError && (
        <section className="member-card" aria-label="Error al cargar el perfil">
          <Alert
            type="error"
            title="No pudimos cargar tu perfil"
            message="Vuelve a intentarlo. Si el problema continúa, contacta con recepción para revisar tu cuenta."
          />
          <Button
            variant="secondary"
            onClick={() => void clientQuery.refetch()}
          >
            Volver a intentar
          </Button>
        </section>
      )}

      {clientQuery.data && (
        <>
          <MembershipSummary state={membershipSummary} />

          <section className="member-card member-dashboard-summary">
            <header className="member-section-header">
              <h2>Mi resumen físico</h2>
            </header>

            {measurementsQuery.isLoading && (
              <SectionSkeleton rows={2} />
            )}

            {measurementsQuery.isError && (
              <Alert
                type="error"
                message="No pudimos cargar tus mediciones."
              />
            )}

            {measurementsQuery.isSuccess && (() => {
              const measurements = measurementsQuery.data;
              const weight = measurements.find(
                (item) => item.weightKg != null
              )?.weightKg;
              const height = measurements.find(
                (item) => item.heightCm != null
              )?.heightCm;

              const bmi =
                weight != null && height != null && height > 0
                  ? weight / (height / 100) ** 2
                  : null;

              return (
                <div className="member-dashboard-stats">
                  <Link
                    to="perfil#measurements"
                      className="member-dashboard-stat member-dashboard-stat-link"
                  >
                <span>Peso registrado</span>
                <strong>
                  {weight != null ? `${weight} kg` : "Sin registrar"}
                </strong>
                  <small>Ver mis mediciones →</small>
                  </Link>

                <Link
                  to="perfil#measurements"
                  className="member-dashboard-stat member-dashboard-stat-link"
                >
                    <span>Altura registrada</span>
                    <strong>
                      {height != null ? `${height} cm` : "Sin registrar"}
                    </strong>
                  <small>Ver mis mediciones →</small>
                </Link>

                <Link
                  to="perfil#measurements"
                    className="member-dashboard-stat member-dashboard-stat-link"
                >
                  <span>Índice de masa corporal</span>
                    <strong>
                      {bmi != null ? bmi.toFixed(1) : "Sin datos"}
                    </strong>
                    <small>Ver mis mediciones →</small>
                </Link>
                </div>
              );
            })()}
          </section>

          <PortalSection
  id="goals-heading"
  title="Mis objetivos fitness"
  action={
    <Link to="perfil#goals" className="member-dashboard-section-link">
      Ver objetivos →
    </Link>
  }
>
  {goalsQuery.isLoading && <SectionSkeleton rows={1} />}

  {goalsQuery.isError && (
    <Alert
      type="error"
      message="No pudimos cargar tus objetivos."
    />
  )}

  {goalsQuery.isSuccess && (
    <div className="member-dashboard-stats">
      <Link
        to="perfil#goals"
        className="member-dashboard-stat member-dashboard-stat-link"
      >
        <span>Objetivos en progreso</span>
        <strong>{activeGoalsCount}</strong>
        <small>Gestionar mis objetivos →</small>
      </Link>

      <Link
        to="perfil#goals"
        className="member-dashboard-stat member-dashboard-stat-link"
      >
        <span>Objetivos completados</span>
        <strong>{completedGoalsCount}</strong>
        <small>Ver mis logros →</small>
      </Link>

      <Link
        to="perfil#progress"
        className="member-dashboard-stat member-dashboard-stat-link"
      >
        <span>Mi progreso físico</span>
        <strong>Ver gráficos</strong>
        <small>Consultar evolución →</small>
      </Link>
    </div>
  )}
</PortalSection>

          <PortalSection id="history-heading" title="Historial de membresías">
            {membershipsQuery.isLoading && <SectionSkeleton rows={2} />}
            {membershipsQuery.isError && (
              <Alert type="error" message="No pudimos cargar tu historial." />
            )}
            {membershipsQuery.isError && (
              <Button
                variant="secondary"
                onClick={() => void membershipsQuery.refetch()}
              >
                Reintentar
              </Button>
            )}
            {!membershipsQuery.isLoading &&
              !membershipsQuery.isError &&
              !membershipsQuery.data?.length && (
                <p className="member-muted">
                  Aún no tienes membresías registradas.
                </p>
              )}
            {!!membershipsQuery.data?.length && (
              <ul className="member-membership-list">
                {membershipsQuery.data.map((membership) => (
                  <li key={membership.id}>
                    <strong>
                      {membership.plan?.name ?? "Plan de membresía"}
                    </strong>
                    <span>
                      {formatDate(membership.startDate)} –{" "}
                      {formatDate(membership.endDate)}
                    </span>
                    <span>{statusLabel(membership.status)}</span>
                  </li>
                ))}
              </ul>
            )}
          </PortalSection>

          <PortalSection id="plans-heading" title="Planes y renovaciones">
            {requestedPlanUnavailable && <Alert type="warning" message="El plan que elegiste ya no está disponible. Elige otro o consulta en recepción." />}
            {plansQuery.isLoading && <SectionSkeleton rows={2} />}
            {plansQuery.isError && (
              <Alert type="error" message="No pudimos cargar los planes." />
            )}
            {plansQuery.isError && (
              <Button
                variant="secondary"
                onClick={() => void plansQuery.refetch()}
              >
                Reintentar
              </Button>
            )}
            {!plansQuery.isLoading &&
              !plansQuery.isError &&
              !plansQuery.data?.length && (
                <p className="member-muted">
                  No hay planes disponibles en este momento. Consulta en
                  recepción.
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
                    <span>
                      {plan.description || "Consulta condiciones en recepción"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="member-muted">
              La solicitud no procesa pagos ni activa la membresía. Recepción
              confirmará los detalles.
            </p>
            {renewalMessage && (
              <Alert
                type="success"
                message={renewalMessage}
                dismissible
                onDismiss={() => setRenewalMessage(null)}
              />
            )}
            {renewalError && (
              <Alert
                type="error"
                message={renewalError}
                dismissible
                onDismiss={() => setRenewalError(null)}
              />
            )}
            {renewalRequestsQuery.isError && (
              <Alert
                type="error"
                message="No pudimos cargar tus solicitudes."
              />
            )}
            {renewalRequestsQuery.isError && (
              <Button
                variant="secondary"
                onClick={() => void renewalRequestsQuery.refetch()}
              >
                Reintentar solicitudes
              </Button>
            )}
            {renewalRequestsQuery.isLoading ? (
              <SectionSkeleton rows={1} />
            ) : openRenewalRequest ? (
              <p className="member-request-status" role="status">
                Solicitud de {openRenewalRequest.planName}:{" "}
                {statusLabel(openRenewalRequest.status)}.
              </p>
            ) : (
              <form
                className="member-profile-form renewal-request-form"
                onSubmit={submitRenewalRequest}
              >
                <FormField
                  id="renewal-plan"
                  name="planId"
                  label="Plan solicitado"
                  type="select"
                  value={validRenewalPlanId}
                  onChange={setRenewalPlanId}
                  required
                  emptyOptionLabel="Selecciona un plan"
                  options={(plansQuery.data ?? []).map((plan) => ({
                    value: String(plan.id),
                    label: `${plan.name} · ${formatMoney(plan.price, plan.currency)}`,
                  }))}
                />
                <FormField
                  id="renewal-note"
                  name="memberNote"
                  label="Comentario para recepción (opcional)"
                  maxLength={500}
                  value={renewalNote}
                  onChange={setRenewalNote}
                />
                <div className="member-profile-actions">
                  <Button
                    type="submit"
                    loading={createRenewalRequest.isPending}
                    disabled={
                      !plansQuery.data?.length ||
                      plansQuery.isLoading ||
                      renewalRequestsQuery.isError
                    }
                  >
                    Solicitar renovación
                  </Button>
                </div>
              </form>
            )}
            {!!renewalRequestsQuery.data?.length && (
              <ul
                className="member-membership-list member-request-history"
                aria-label="Historial de solicitudes"
              >
                {renewalRequestsQuery.data.map((request) => (
                  <li key={request.id}>
                    <strong>{request.planName}</strong>
                    <span>{formatDate(request.requestedAt)}</span>
                    <span>{statusLabel(request.status)}</span>
                  </li>
                ))}
              </ul>
            )}
          </PortalSection>

          <PortalSection id="payments-heading" title="Mis pagos">
            {paymentsQuery.isLoading && <SectionSkeleton rows={2} />}
            {paymentsQuery.isError && (
              <Alert type="error" message="No pudimos cargar tus pagos." />
            )}
            {paymentsQuery.isError && (
              <Button
                variant="secondary"
                onClick={() => void paymentsQuery.refetch()}
              >
                Reintentar
              </Button>
            )}
            {!paymentsQuery.isLoading &&
              !paymentsQuery.isError &&
              !paymentsQuery.data?.data.length && (
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
                    <span>{statusLabel(payment.status)}</span>
                  </li>
                ))}
              </ul>
            )}
          </PortalSection>
        </>
      )}
     </div>
  );
}