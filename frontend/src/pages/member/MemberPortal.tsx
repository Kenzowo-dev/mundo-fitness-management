import MembershipSummary, { type MembershipSummaryState } from "../../components/MembershipSummary";
import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/useAuth";
import {
  useOwnMeasurements,
  useOwnGoals,
} from "../../hooks/useApi";
import type {
  Client,
  ClientMembership,
} from "../../types/api";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Skeleton from "../../components/Skeleton";
import "@/styles/dashboard/MemberPortal.css";

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(parsed);
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

        </>
      )}
     </div>
  );
}
