import Button from "./Button";
import Skeleton from "./Skeleton";

export type MembershipSummaryState =
  | { kind: "loading" }
  | { kind: "unavailable"; retry: () => void }
  | { kind: "active"; planName: string; validUntil: string }
  | { kind: "inactive" };

export default function MembershipSummary({
  state,
}: {
  state: MembershipSummaryState;
}) {
  let title: string;
  let label: string;
  let details: React.ReactNode;
  switch (state.kind) {
    case "loading":
      title = "Consultando vigencia…";
      label = "Consultando";
      details = <Skeleton height="18px" width="55%" />;
      break;
    case "unavailable":
      title = "Vigencia no disponible";
      label = "No disponible";
      details = (
        <>
          <p>No pudimos consultar tu membresía. Vuelve a intentarlo.</p>
          <Button variant="secondary" onClick={state.retry}>
            Reintentar vigencia
          </Button>
        </>
      );
      break;
    case "active":
      title = state.planName;
      label = "Vigente";
      details = <p>Válida hasta el {state.validUntil}</p>;
      break;
    case "inactive":
      title = "Sin membresía vigente";
      label = "Sin vigencia";
      details = (
        <p>Solicita una renovación y recepción te ayudará a activarla.</p>
      );
      break;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
  return (
    <section
      className="member-card membership-status"
      aria-labelledby="membership-heading"
      aria-busy={state.kind === "loading"}
    >
      <div className="membership-summary">
        <p className="member-eyebrow">TU MEMBRESÍA</p>
        <h2 id="membership-heading">{title}</h2>
        {details}
      </div>
      <span
        className={`membership-badge ${state.kind === "active" ? "is-active" : state.kind === "inactive" ? "is-inactive" : "is-loading"}`}
      >
        {label}
      </span>
    </section>
  );
}
