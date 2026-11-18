import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../api/client";
import type {
  FitnessWorkoutLog,
  FitnessWorkoutLogInput,
  FitnessWorkoutSession,
} from "../../types/fitness";

import "@/styles/dashboard/MemberFitnessTracking.css";
import { FITNESS_WEEKDAYS, getFitnessWeek, getLimaDate, shiftFitnessDate } from "./fitnessSchedule";

function useFitnessHistory() {
  return useQuery({
    queryKey: ["fitness", "history"],
    queryFn: () => api.getOwnFitnessWorkoutHistory(),
    retry: false,
    staleTime: 30_000,
  });
}

function getLimaDateDaysAgo(daysAgo: number): string {
  return shiftFitnessDate(getLimaDate(), -daysAgo);
}

function formatPerformedDay(value: string): string {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString(
    "es-PE",
    { dateStyle: "medium", timeZone: "America/Lima" },
  );
}
function formatWorkoutDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return date.toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  });
}

interface LogFormProps {
  session: FitnessWorkoutSession;
  canRegister: boolean;
}

export function FitnessWorkoutLogForm({
  session,
  canRegister,
}: LogFormProps) {
  const queryClient = useQueryClient();
  const historyQuery = useFitnessHistory();

  const [performedOn, setPerformedOn] = useState(
    getLimaDateDaysAgo(0),
  );
  const [minutes, setMinutes] = useState("");
  const [effort, setEffort] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: FitnessWorkoutLogInput) =>
      api.completeOwnFitnessWorkout(session.id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["fitness", "history"],
      });
    },
  });

  const timesCompleted = (historyQuery.data ?? []).filter(
    (log) => log.sessionId === session.id,
  ).length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!canRegister || mutation.isPending) return;

    if (
      !performedOn ||
      performedOn < getLimaDateDaysAgo(13) ||
      performedOn > getLimaDateDaysAgo(0)
    ) {
      setValidationError(
        "Selecciona una fecha válida dentro de los últimos 14 días.",
      );
      return;
    }

    const duration = minutes.trim() === ""
      ? undefined
      : Number(minutes);

    const perceivedEffort = effort.trim() === ""
      ? undefined
      : Number(effort);

    if (
      duration !== undefined &&
      (!Number.isInteger(duration) || duration < 1 || duration > 180)
    ) {
      setValidationError("La duración debe estar entre 1 y 180 minutos.");
      return;
    }

    if (
      perceivedEffort !== undefined &&
      (!Number.isInteger(perceivedEffort) ||
        perceivedEffort < 1 ||
        perceivedEffort > 10)
    ) {
      setValidationError("El esfuerzo debe estar entre 1 y 10.");
      return;
    }

    if (notes.trim().length > 2000) {
      setValidationError("Las observaciones son demasiado largas.");
      return;
    }

    try {
      if (
        duration !== undefined &&
        duration > Math.max(60, session.estimatedMinutes * 2) &&
        !window.confirm(
          `Tu rutina estimaba ${session.estimatedMinutes} minutos, pero ingresaste ${duration}. ¿Confirmas que es correcto?`,
        )
      ) {
        return;
      }

      await mutation.mutateAsync({
        performedOn,
        durationMinutes: duration,
        perceivedEffort,
        notes: notes.trim() || undefined,
      });

      setMinutes("");
      setEffort("");
      setNotes("");
    } catch {
      // El error se muestra desde el estado de la mutación.
    }
  }

  return (
    <section className="fitness-workout-log">
      {historyQuery.isSuccess && timesCompleted > 0 && (
        <p className="fitness-workout-log-status">
          Has registrado este entrenamiento {timesCompleted}
          {timesCompleted === 1 ? " vez." : " veces."}
          {" "}Puedes volver a registrarlo otro día.
        </p>
      )}

      <form onSubmit={(event) => void handleSubmit(event)}>
        <label>
          ¿Qué día realizaste el entrenamiento?
          <div className="fitness-workout-date-shortcuts">
            <button
              type="button"
              onClick={() => setPerformedOn(getLimaDateDaysAgo(0))}
              disabled={!canRegister || mutation.isPending}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setPerformedOn(getLimaDateDaysAgo(1))}
              disabled={!canRegister || mutation.isPending}
            >
              Ayer
            </button>
          </div>
          <input
            type="date"
            required
            min={getLimaDateDaysAgo(13)}
            max={getLimaDateDaysAgo(0)}
            value={performedOn}
            onChange={(event) => setPerformedOn(event.target.value)}
            disabled={!canRegister || mutation.isPending}
          />
        </label>
        <label>
          Duración real (minutos)
          <input
            type="number"
            min="1"
            max="180"
            step="1"
            placeholder={String(session.estimatedMinutes)}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            disabled={!canRegister || mutation.isPending}
          />
        </label>
        {minutes.trim() !== "" &&
          Number.isFinite(Number(minutes)) &&
          Number(minutes) > Math.max(60, session.estimatedMinutes * 2) && (
            <p className="fitness-duration-warning" role="status">
              Esta duración supera ampliamente lo estimado.
              Comprueba los minutos antes de guardar.
            </p>
          )}

        <label>
          Esfuerzo percibido
          <select
            value={effort}
            onChange={(event) => setEffort(event.target.value)}
            disabled={!canRegister || mutation.isPending}
          >
            <option value="">No especificar</option>
            {Array.from({ length: 10 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1} / 10
              </option>
            ))}
          </select>
        </label>

        <label className="fitness-workout-log-notes">
          Observaciones (opcional)
          <textarea
            rows={2}
            maxLength={2000}
            placeholder="¿Cómo te sentiste durante el entrenamiento?"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={!canRegister || mutation.isPending}
          />
        </label>

        {validationError && (
          <p role="alert" className="fitness-workout-log-error">
            {validationError}
          </p>
        )}

        {mutation.isError && (
          <p role="alert" className="fitness-workout-log-error">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "No pudimos registrar el entrenamiento."}
          </p>
        )}

        {mutation.isSuccess && (
          <p role="status" className="fitness-workout-log-status">
            Entrenamiento registrado correctamente.
          </p>
        )}

        {!canRegister && (
          <p className="fitness-workout-log-error">
            Necesitas una membresía vigente para registrar entrenamientos.
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canRegister || mutation.isPending}
        >
          {mutation.isPending
            ? "Guardando entrenamiento..."
            : "Guardar entrenamiento"}
        </button>
      </form>
    </section>
  );
}

interface ProgressProps {
  sessions: FitnessWorkoutSession[];
}

export function FitnessWorkoutWeek({ sessions }: ProgressProps) {
  const historyQuery = useFitnessHistory();
  const { start, end, entries } = getFitnessWeek(sessions, historyQuery.data ?? []);

  return (
    <section className="member-card fitness-week">
      <h2>Esta semana</h2>
      <p>{formatPerformedDay(start)} – {formatPerformedDay(end)}</p>
      {entries.length === 0 ? (
        <p>Genera una rutina para ver tu planificación semanal.</p>
      ) : (
        <ul>
          {entries.map(({ session, scheduledOn, performedDates, status }) => (
            <li key={session.id}>
              <strong>{FITNESS_WEEKDAYS[session.dayNumber - 1]} · {session.title}</strong>
              <span
                className="fitness-week-status"
                data-completed={historyQuery.isSuccess && status === "Completado"}
              >
                {historyQuery.isSuccess ? status : "Estado sin confirmar"}
              </span>
              <span>Fecha programada: {formatPerformedDay(scheduledOn)}</span>
              {performedDates.length > 0 && (
                <span>Realizado: {performedDates.map(formatPerformedDay).join(", ")}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function FitnessWorkoutProgress({ sessions }: ProgressProps) {
  const historyQuery = useFitnessHistory();
  const [visibleLogs, setVisibleLogs] = useState(20);

  if (historyQuery.isPending) {
    return (
      <section className="member-card" role="status">
        Cargando tu historial de entrenamientos...
      </section>
    );
  }

  if (historyQuery.isError) {
    return (
      <section className="member-card">
        <h2>Mi progreso</h2>
        <p role="alert">
          No pudimos cargar tu historial.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void historyQuery.refetch()}
        >
          Reintentar
        </button>
      </section>
    );
  }

  const logs = [...(historyQuery.data ?? [])].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() -
      new Date(a.completedAt).getTime(),
  );

  const totalMinutes = logs.reduce(
    (total, log) => total + (log.durationMinutes ?? 0),
    0,
  );

  const withEffort = logs.filter(
    (log) => log.perceivedEffort !== undefined &&
      log.perceivedEffort !== null,
  );

  const averageEffort = withEffort.length > 0
    ? (
      withEffort.reduce(
        (total, log) => total + (log.perceivedEffort ?? 0),
        0,
      ) / withEffort.length
    ).toFixed(1)
    : "—";

  const sessionNames = new Map(
    sessions.map((session) => [session.id, session.title]),
  );

  return (
    <section className="member-card fitness-progress">
      <header className="member-section-header">
        <div>
          <h2>Mi progreso</h2>
          <p>Consulta tus entrenamientos registrados.</p>
        </div>
      </header>

      <div className="fitness-progress-stats">
        <div>
          <strong>{logs.length}</strong>
          <span>Entrenamientos registrados</span>
        </div>
        <div>
          <strong>{totalMinutes}</strong>
          <span>Minutos registrados</span>
        </div>
        <div>
          <strong>{averageEffort}</strong>
          <span>Esfuerzo medio / 10</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <p>
          Todavía no has registrado entrenamientos.
          Puedes registrar tu primera sesión desde esta página.
        </p>
      ) : (
        <div className="fitness-progress-history">
          <h3>Historial de entrenamientos</h3>

          {logs.slice(0, visibleLogs).map((log: FitnessWorkoutLog) => (
            <article
              key={log.id}
              className="fitness-progress-entry"
            >
              <div>
                <strong>
                  {log.sessionTitle ?? sessionNames.get(log.sessionId) ??
                    `Entrenamiento #${log.sessionId}`}
                </strong>
                <span>
                  {log.performedOn
                    ? `Realizado: ${formatPerformedDay(log.performedOn)} · Registrado: ${formatWorkoutDate(log.completedAt)}`
                    : `Registrado: ${formatWorkoutDate(log.completedAt)} · Fecha realizada no indicada`}
                </span>
              </div>

              <div className="fitness-progress-entry-data">
                {log.durationMinutes != null && (
                  <span>{log.durationMinutes} min</span>
                )}
                {log.perceivedEffort != null && (
                  <span>Esfuerzo {log.perceivedEffort}/10</span>
                )}
              </div>

              {log.notes && <p>{log.notes}</p>}
            </article>
          ))}

          {logs.length > visibleLogs && (
            <button type="button" className="btn btn-secondary" onClick={() => setVisibleLogs(visibleLogs + 20)}>
              Ver más entrenamientos
            </button>
          )}
        </div>
      )}
    </section>
  );
}
