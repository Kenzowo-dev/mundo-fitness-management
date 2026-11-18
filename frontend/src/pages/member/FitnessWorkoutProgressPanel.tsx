import { useState } from "react";
import "@/styles/dashboard/MemberFitnessProgressControls.css";
import type { FitnessWorkoutSession } from "../../types/fitness";
import {
  FitnessWorkoutLogForm,
  FitnessWorkoutProgress,
  FitnessWorkoutWeek,
} from "./FitnessWorkoutTracking";
import { FITNESS_WEEKDAYS } from "./fitnessSchedule";

interface Props {
  sessions: FitnessWorkoutSession[];
  canRegister: boolean;
}

export default function FitnessWorkoutProgressPanel({
  sessions,
  canRegister,
}: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const orderedSessions = [...sessions].sort((a, b) => a.dayNumber - b.dayNumber);

  const selectedSession =
    orderedSessions.find(
      (session) => String(session.id) === selectedSessionId,
    ) ?? orderedSessions[0];

  return (
    <div className="fitness-progress-panel">
      <FitnessWorkoutWeek sessions={sessions} />
      <section className="member-card fitness-progress-registration">
          <div>
            <h3>Registrar mi entrenamiento</h3>
            <p>
              Selecciona el entrenamiento que realizaste,
              indica la fecha y registra cómo te fue.
            </p>
          </div>

          {!selectedSession ? (
            <p>
              Necesitas una rutina activa para registrar
              nuevos entrenamientos. Tu historial anterior
              seguirá disponible.
            </p>
          ) : (
            <>
              <label
                htmlFor="fitness-progress-session-selector"
                className="fitness-progress-session-field"
              >
                <strong>¿Qué entrenamiento realizaste?</strong>

                <select
                  id="fitness-progress-session-selector"
                  value={String(selectedSession.id)}
                  onChange={(event) =>
                    setSelectedSessionId(event.target.value)
                  }
                  disabled={!canRegister}
                >
                  {orderedSessions.map((session) => (
                    <option
                      key={session.id}
                      value={String(session.id)}
                    >
                      {FITNESS_WEEKDAYS[session.dayNumber - 1]} · {session.title}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p>
                  Duración estimada:{" "}
                  <strong>
                    {selectedSession.estimatedMinutes} minutos
                  </strong>
                </p>
              </div>

              <FitnessWorkoutLogForm
                key={selectedSession.id}
                session={selectedSession}
                canRegister={canRegister}
              />
            </>
          )}
      </section>

      <FitnessWorkoutProgress sessions={sessions} />
    </div>
  );
}
