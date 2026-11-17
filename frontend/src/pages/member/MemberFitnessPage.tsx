import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import type { Client, ClientMembership } from "../../types/api";
import FitnessPreferencesForm from "./FitnessPreferencesForm";
import type { FitnessProfileInput } from "../../types/fitness";
import type {
  FitnessPlan,
  FitnessProfile,
  FitnessPlanWithSessions,
} from "../../types/fitness";
import Alert from "../../components/Alert";
import Skeleton from "../../components/Skeleton";
import "@/styles/dashboard/MemberPortal.css";
import "@/styles/dashboard/MemberFitness.css";

function fitnessPreferencesChanged(
  current: FitnessProfileInput,
  previous: FitnessProfileInput,
): boolean {
  const comparable = (values: FitnessProfileInput) => ({
    fitnessLevel: values.fitnessLevel,
    trainingLocation: values.trainingLocation,
    equipment: [...values.equipment].sort(),
    daysPerWeek: values.daysPerWeek,
    sessionMinutes: values.sessionMinutes,
    preferredGoal: values.preferredGoal,
    mobilityNotes: values.mobilityNotes?.trim() ?? "",
    preferredExerciseTypes: [
      ...(values.preferredExerciseTypes ?? []),
    ].sort(),
    avoidedExerciseIds: [
      ...(values.avoidedExerciseIds ?? []),
    ].sort(),
    preferredIntensity: values.preferredIntensity ?? "moderate",
  });

  return (
    JSON.stringify(comparable(current)) !==
    JSON.stringify(comparable(previous))
  );
}
const levelLabels = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const locationLabels = {
  home: "Casa",
  gym: "Gimnasio",
  both: "Casa y gimnasio",
};

const goalLabels = {
  weight: "Control de peso",
  muscle: "Ganancia muscular",
  body_fat: "Reducir grasa corporal",
  endurance: "Resistencia",
  strength: "Fuerza",
  general: "Bienestar general",
};

/**
 * Página principal del recomendador fitness.
 * Consulta los datos del socio autenticado y presenta su plan.
 */
export default function MemberFitnessPage() {
  const queryClient = useQueryClient();
  const [fitnessNoticeAccepted, setFitnessNoticeAccepted] = useState(false);
  const { user } = useAuth();

  const defaultProfile: FitnessProfileInput = {
    fitnessLevel: "beginner",
    trainingLocation: "home",
    equipment: [],
    daysPerWeek: 3,
    sessionMinutes: 45,
    preferredGoal: "general",
    mobilityNotes: null,
    preferredExerciseTypes: [],
    avoidedExerciseIds: [],
    preferredIntensity: "moderate",
  };

  const saveProfileMutation = useMutation({
    mutationFn: (values: FitnessProfileInput) =>
      api.saveOwnFitnessProfile({
        fitnessLevel: values.fitnessLevel,
        trainingLocation: values.trainingLocation,
        equipment: values.equipment,
        daysPerWeek: values.daysPerWeek,
        sessionMinutes: values.sessionMinutes,
        preferredGoal: values.preferredGoal,
        mobilityNotes: values.mobilityNotes,
        preferredExerciseTypes: values.preferredExerciseTypes,
        avoidedExerciseIds: values.avoidedExerciseIds,
        preferredIntensity: values.preferredIntensity,
        dietaryPreferences: values.dietaryPreferences,
        dislikedIngredients: values.dislikedIngredients,
        foodAllergies: values.foodAllergies,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["fitness", "profile"],
      });
    },
  });

  const profileQuery = useQuery<FitnessProfile | null>({
    queryKey: ["fitness", "profile"],
    queryFn: () => api.getOwnFitnessProfile(),
    retry: false,
  });

  const plansQuery = useQuery<FitnessPlan[]>({
    queryKey: ["fitness", "plans"],
    queryFn: () => api.getOwnFitnessPlans(),
    retry: false,
  });

  const activePlan = plansQuery.data?.find(
    (plan) => plan.status === "active",
  );

  const planQuery = useQuery<FitnessPlanWithSessions>({
    queryKey: ["fitness", "plan", activePlan?.id],
    queryFn: () => api.getOwnFitnessPlanById(activePlan!.id),
    enabled: !!activePlan,
    retry: false,
  });

  const generatePlanMutation = useMutation({
    mutationFn: () => api.createOwnFitnessPlan(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["fitness", "plans"],
      });
    },
  });

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
    retry: false,
  });

  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const membershipLoading =
    clientQuery.isPending || membershipsQuery.isPending;

  const membershipError =
    clientQuery.isError || membershipsQuery.isError;

  const hasActiveMembership =
    !membershipLoading &&
    !membershipError &&
    (membershipsQuery.data?.some(
      (membership) =>
        membership.status === "active" &&
        membership.startDate.slice(0, 10) <= today &&
        membership.endDate.slice(0, 10) >= today,
    ) ?? false);

  const profile = profileQuery.data;
  const plan = planQuery.data;

  const preferencesChanged = Boolean(
    profile &&
    activePlan &&
    fitnessPreferencesChanged(profile, activePlan.profileSnapshot),
  );

  const mobilityReviewRequired = Boolean(profile?.mobilityNotes?.trim());

  return (
    <div className="member-portal">
      <header className="member-portal-header">
        <div>
          <p className="member-eyebrow">
            MUNDO FITNESS · PORTAL DEL SOCIO
          </p>
          <h1>Mi recomendador fitness</h1>
          <p>
            Consulta tu perfil y descubre tus entrenamientos
            personalizados.
          </p>
        </div>
      </header>

      {(profileQuery.isLoading || plansQuery.isLoading) && (
        <section className="member-card">
          <Skeleton height="100px" />
        </section>
      )}

      {(profileQuery.isError || plansQuery.isError) && (
        <section className="member-card">
          <Alert
            type="error"
            message="No pudimos cargar tu información fitness."
          />
          <button
            type="button"
            onClick={() => {
              void profileQuery.refetch();
              void plansQuery.refetch();
            }}
          >
            Reintentar
          </button>
        </section>
      )}

      {!profileQuery.isLoading && !profileQuery.isError && (
        <section className="member-card">
          <header className="member-section-header">
            <h2>Configura tu entrenamiento</h2>
          </header>

          <p>
            Personaliza tus preferencias para recibir
            recomendaciones de entrenamiento.
          </p>

          <FitnessPreferencesForm
            key={profile?.id ?? "new"}
            initialValues={profile ?? defaultProfile}
            saving={saveProfileMutation.isPending}
            onSave={async (values) => {
              await saveProfileMutation.mutateAsync(values);
            }}
          />

          {saveProfileMutation.isSuccess && (
            <Alert
              type="success"
              message="Preferencias guardadas correctamente."
            />
          )}
        </section>
      )}

      {profile && (
        <section className="member-card">
          <header className="member-section-header">
            <h2>Mi perfil fitness</h2>
          </header>

          <p>
            <strong>Nivel:</strong>{" "}
            {levelLabels[profile.fitnessLevel]}
          </p>
          <p>
            <strong>Objetivo:</strong>{" "}
            {goalLabels[profile.preferredGoal]}
          </p>
          <p>
            <strong>Lugar:</strong>{" "}
            {locationLabels[profile.trainingLocation]}
          </p>
          <p>
            <strong>Frecuencia:</strong>{" "}
            {profile.daysPerWeek} días por semana
          </p>
          <p>
            <strong>Tiempo disponible:</strong>{" "}
            {profile.sessionMinutes} minutos
          </p>
        </section>
      )}

      {profile &&
        !plansQuery.isLoading &&
        !plansQuery.isError &&
        (!activePlan || preferencesChanged) && (
          <section className="member-card">
            <header className="member-section-header">
              <h2>{activePlan ? "Actualizar mi rutina" : "Generar mi rutina personalizada"}</h2>
            </header>

            <p>
              {activePlan
                ? "Tus preferencias cambiaron. Puedes generar una nueva rutina y conservar la anterior en el historial."
                : "Crearemos un plan semanal según tus objetivos, experiencia, equipamiento y preferencias."}
            </p>
            <div className="fitness-safety-notice">
              <h3>Aviso de uso responsable</h3>
              <p>
                Este recomendador ofrece sugerencias generales basadas en tus
                preferencias. No sustituye la evaluación de un profesional
                de salud o un entrenador cualificado.
              </p>
              <p>
                Si tienes lesiones, enfermedades o restricciones físicas,
                consulta con un profesional antes de entrenar.
                Detén la actividad si experimentas dolor, mareos o malestar.
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={fitnessNoticeAccepted}
                  onChange={(event) =>
                    setFitnessNoticeAccepted(event.target.checked)
                  }
                />
                He leído y comprendido estas recomendaciones.
              </label>
            </div>

            {mobilityReviewRequired && (
              <Alert
                type="error"
                message="Has indicado limitaciones de movilidad. Necesitas una evaluación antes de generar una rutina automática."
              />
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={
                generatePlanMutation.isPending ||
                !hasActiveMembership ||
                !fitnessNoticeAccepted ||
                mobilityReviewRequired
              }
              onClick={() => {
                if (
                  activePlan &&
                  !window.confirm(
                    "Se archivará tu rutina actual y se generará una nueva. Tus entrenamientos registrados se conservarán. ¿Deseas continuar?",
                  )
                ) {
                  return;
                }

                void generatePlanMutation.mutateAsync().catch(() => {});
              }}
            >
              {generatePlanMutation.isPending
                ? (activePlan ? "Actualizando rutina..." : "Generando rutina...")
                : (activePlan ? "Actualizar mi rutina" : "Generar mi rutina")}
            </button>

            {membershipLoading && (
              <p>Comprobando tu membresía...</p>
            )}

            {membershipError && (
              <>
                <Alert
                  type="error"
                  message="No pudimos comprobar tu membresía. Inténtalo nuevamente."
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (clientQuery.isError) {
                      void clientQuery.refetch();
                    } else {
                      void membershipsQuery.refetch();
                    }
                  }}
                >
                  Reintentar
                </button>
              </>
            )}

            {!membershipLoading && !membershipError && !hasActiveMembership && (
              <>
                <Alert
                  type="error"
                  message="Necesitas una membresía vigente para generar rutinas. Tus preferencias y planes anteriores seguirán disponibles."
                />
                <Link
                  to="/portal/pagos"
                  className="member-dashboard-section-link"
                >
                  Ver planes disponibles
                </Link>
              </>
            )}
            {generatePlanMutation.isError && (
              <Alert
                type="error"
                message={
                  generatePlanMutation.error instanceof Error
                    ? generatePlanMutation.error.message
                    : "No pudimos generar tu rutina. Inténtalo nuevamente."
                }
              />
            )}
          </section>
        )}

      {planQuery.isLoading && (
        <section className="member-card">
          <Skeleton height="120px" />
        </section>
      )}

      {planQuery.isError && (
        <section className="member-card">
          <Alert
            type="error"
            message="No pudimos cargar tu plan de entrenamiento."
          />
          <button
            type="button"
            onClick={() => void planQuery.refetch()}
          >
            Reintentar
          </button>
        </section>
      )}

      {plan && (
        <section className="member-card fitness-workout-plan">
          <header className="member-section-header">
            <div>
              <h2>{plan.name}</h2>
              <p>
                Tu programa contiene {plan.sessions.length} sesiones
                de entrenamiento.
              </p>
            </div>
          </header>

          <div className="fitness-workout-sessions">
            {plan.sessions.map((session) => (
              <article
                key={session.id}
                className="fitness-workout-session"
              >
                <header className="fitness-workout-session-header">
                  <span className="fitness-workout-day">
                    Día {session.dayNumber}
                  </span>
                  <div>
                    <h3>{session.title}</h3>
                    <p>
                      {session.estimatedMinutes} minutos estimados
                      {" · "}
                      {session.exercises.length} ejercicios
                    </p>
                  </div>
                </header>

                <div className="fitness-workout-phase">
                  <h4>01 · Calentamiento</h4>
                  <p>
                    Prepara tu cuerpo antes del entrenamiento.
                  </p>

                  {session.warmup.map((activity, index) => (
                    <details
                      key={`${activity.name}-${index}`}
                      className="fitness-workout-detail"
                    >
                      <summary>
                        <span>{activity.name}</span>
                        <span className="fitness-workout-meta">
                          {Math.ceil(activity.durationSeconds / 60)} min
                        </span>
                      </summary>

                      <div className="fitness-workout-detail-body">
                        <p>{activity.description}</p>
                        {activity.instructions.length > 0 && (
                          <ol>
                            {activity.instructions.map((instruction, step) => (
                              <li key={step}>{instruction}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </details>
                  ))}
                </div>

                <div className="fitness-workout-phase">
                  <h4>02 · Ejercicios principales</h4>
                  <p>
                    Consulta la técnica y los descansos de cada ejercicio.
                  </p>

                  {session.exercises.map((exercise, index) => (
                    <details
                      key={`${exercise.exerciseId}-${index}`}
                      className="fitness-workout-detail"
                    >
                      <summary>
                        <span>{exercise.name}</span>
                        <span className="fitness-workout-meta">
                          {exercise.sets} series
                        </span>
                      </summary>

                      <div className="fitness-workout-detail-body">
                        <p>{exercise.description}</p>

                        <div className="fitness-workout-stats">
                          <span>{exercise.sets} series</span>
                          <span>{exercise.reps} repeticiones</span>
                          <span>
                            {exercise.restSeconds} s descanso
                          </span>
                          {exercise.durationSeconds !== undefined && (
                            <span>
                              {Math.ceil(exercise.durationSeconds / 60)}
                              {" "}min de actividad
                            </span>
                          )}
                        </div>

                        {exercise.instructions.length > 0 && (
                          <div>
                            <h5>Cómo realizarlo</h5>
                            <ol>
                              {exercise.instructions.map(
                                (instruction, step) => (
                                  <li key={step}>{instruction}</li>
                                ),
                              )}
                            </ol>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>

                <div className="fitness-workout-phase">
                  <h4>03 · Enfriamiento</h4>
                  <p>
                    Finaliza tu sesión de forma gradual.
                  </p>

                  {session.cooldown.map((activity, index) => (
                    <details
                      key={`${activity.name}-${index}`}
                      className="fitness-workout-detail"
                    >
                      <summary>
                        <span>{activity.name}</span>
                        <span className="fitness-workout-meta">
                          {Math.ceil(activity.durationSeconds / 60)} min
                        </span>
                      </summary>

                      <div className="fitness-workout-detail-body">
                        <p>{activity.description}</p>
                        {activity.instructions.length > 0 && (
                          <ol>
                            {activity.instructions.map((instruction, step) => (
                              <li key={step}>{instruction}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {!plansQuery.isLoading &&
        !plansQuery.isError &&
        !activePlan && (
          <section className="member-card">
            <h2>Mi plan de entrenamiento</h2>
            <p>
              No tienes un plan activo actualmente.
            </p>
          </section>
        )}
    </div>
  );
}
