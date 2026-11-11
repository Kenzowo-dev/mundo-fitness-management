import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/useAuth";
import type { Client, ClientMembership } from "../../types/api";
import MembershipSummary, {
  type MembershipSummaryState,
} from "../../components/MembershipSummary";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import Skeleton from "../../components/Skeleton";
import "@/styles/dashboard/MemberPortal.css";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
  }).format(date);
}

const statusLabels: Record<string, string> = {
  active: "Activa",
  expired: "Vencida",
  cancelled: "Cancelada",
  frozen: "Congelada",
};

export default function MemberMembershipPage() {
  const { user } = useAuth();

  const clientQuery = useQuery<Client>({
    queryKey: ["member-portal", "client", user?.id],
    queryFn: () => api.getClientByUserId(user!.id),
    enabled: !!user?.id,
    retry: false,
  });

  const clientId = clientQuery.data?.id;

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

  const summary: MembershipSummaryState = membershipsQuery.isLoading
    ? { kind: "loading" }
    : membershipsQuery.isError
      ? {
          kind: "unavailable",
          retry: () => void membershipsQuery.refetch(),
        }
      : activeMembership
        ? {
            kind: "active",
            planName: activeMembership.plan?.name ?? "Mi membresía",
            validUntil: formatDate(activeMembership.endDate),
          }
        : { kind: "inactive" };

  return (
    <div className="member-portal">
      <header className="member-portal-header">
        <div>
          <p className="member-eyebrow">MUNDO FITNESS · PORTAL DEL SOCIO</p>
          <h1>Mi membresía</h1>
          <p>Consulta tu plan, beneficios e historial de membresías.</p>
        </div>
      </header>

      {clientQuery.isLoading && (
        <section className="member-card" aria-label="Cargando cliente">
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
          <MembershipSummary state={summary} />

          <section className="member-card">
            <header className="member-section-header">
              <h2>Historial de membresías</h2>
            </header>

            {membershipsQuery.isLoading && <Skeleton height="80px" />}

            {membershipsQuery.isError && (
              <>
                <Alert type="error" message="No pudimos cargar tu historial." />
                <Button
                  variant="secondary"
                  onClick={() => void membershipsQuery.refetch()}
                >
                  Reintentar
                </Button>
              </>
            )}

            {membershipsQuery.isSuccess && !membershipsQuery.data.length && (
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
                    <span>
                      {statusLabels[membership.status] ?? membership.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="member-card">
            <header className="member-section-header">
              <h2>Planes y renovaciones</h2>
            </header>
            <p className="member-muted">
              Explora los planes disponibles y gestiona tu próxima compra.
            </p>
            <Link to="/portal/pagos" className="member-dashboard-section-link">
              Ver planes disponibles →
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
