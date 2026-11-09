import { useState, type FormEvent } from "react";
import {
  useOwnGoals,
  useCreateOwnGoal,
  useUpdateOwnGoal,
  useDeleteOwnGoal,
} from "../../hooks/useApi";
import type { ClientGoal, CreateOwnGoalInput } from "../../types/api";
import Button from "../Button";
import Alert from "../Alert";
import "@/styles/member/MemberGoals.css";

const initialForm: CreateOwnGoalInput = {
  goalType: "weight",
  description: "",
  targetValue: undefined,
  currentValue: undefined,
  unit: "kg",
  targetDate: "",
};

function getGoalLabel(type: string) {
  const labels: Record<string, string> = {
    weight: "Peso corporal",
    muscle: "Masa muscular",
    body_fat: "Grasa corporal",
    endurance: "Resistencia",
    strength: "Fuerza",
    custom: "Objetivo personalizado",
  };

  return labels[type] ?? type;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "achieved":
      return "Completado";
    case "cancelled":
      return "Cancelado";
    default:
      return "En progreso";
  }
}

export default function MemberGoals() {
  const goalsQuery = useOwnGoals();
  const createGoal = useCreateOwnGoal();
  const updateGoal = useUpdateOwnGoal();
  const deleteGoal = useDeleteOwnGoal();

  const [form, setForm] = useState<CreateOwnGoalInput>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ClientGoal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const goals = goalsQuery.data ?? [];
  const activeGoals = goals.filter((goal) => goal.status === "in_progress");
  const completedGoals = goals.filter((goal) => goal.status === "achieved");

  const isSaving = createGoal.isPending || updateGoal.isPending;

  function resetForm() {
    setForm({ ...initialForm });
    setEditingGoal(null);
    setShowForm(false);
    setError(null);
  }

  function beginEdit(goal: ClientGoal) {
    setEditingGoal(goal);
    setForm({
      goalType: goal.goalType,
      description: goal.description ?? "",
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit ?? "",
      targetDate: goal.targetDate?.slice(0, 10) ?? "",
    });
    setError(null);
    setMessage(null);
    setShowForm(true);
  }

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (
      form.targetValue !== undefined &&
      form.currentValue !== undefined &&
      form.targetValue < 0
    ) {
      setError("El valor objetivo no puede ser negativo.");
      return;
    }

    const payload = {
      description: form.description?.trim() || undefined,
      targetValue: form.targetValue,
      currentValue: form.currentValue,
      unit: form.unit?.trim() || undefined,
      targetDate: form.targetDate || undefined,
    };

    try {
      if (editingGoal) {
        await updateGoal.mutateAsync({
          id: editingGoal.id,
          data: payload,
        });
        setMessage("Objetivo actualizado correctamente.");
      } else {
        await createGoal.mutateAsync({
          goalType: form.goalType,
          ...payload,
        });
        setMessage("Objetivo creado correctamente.");
      }

      resetForm();
    } catch {
      setError("No pudimos guardar el objetivo. Inténtalo nuevamente.");
    }
  }

  async function changeStatus(
    goal: ClientGoal,
    status: "in_progress" | "achieved" | "cancelled"
  ) {
    setError(null);
    setMessage(null);

    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        data: { status },
      });
      setMessage("Estado del objetivo actualizado.");
    } catch {
      setError("No pudimos actualizar el estado del objetivo.");
    }
  }

  async function removeGoal(goal: ClientGoal) {
    if (!window.confirm(`¿Eliminar el objetivo "${getGoalLabel(goal.goalType)}"?`)) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      await deleteGoal.mutateAsync(goal.id);
      setMessage("Objetivo eliminado correctamente.");
    } catch {
      setError("No pudimos eliminar el objetivo.");
    }
  }

  return (
    <section className="member-card member-goals" id="goals">
      <header className="member-section-header">
        <div>
          <h2>Mis objetivos fitness</h2>
          <p>Define tus metas y registra tus avances.</p>
        </div>

        {!showForm && (
          <Button type="button" onClick={() => setShowForm(true)}>
            Nuevo objetivo
          </Button>
        )}
      </header>

      <div className="member-goals-summary">
        <div>
          <strong>{activeGoals.length}</strong>
          <span>En progreso</span>
        </div>
        <div>
          <strong>{completedGoals.length}</strong>
          <span>Completados</span>
        </div>
        <div>
          <strong>{goals.length}</strong>
          <span>Total</span>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {message && <Alert type="success" message={message} />}

      {showForm && (
        <form className="member-goals-form" onSubmit={saveGoal}>
          <h3>{editingGoal ? "Editar objetivo" : "Crear objetivo"}</h3>

          {!editingGoal && (
            <label>
              Tipo de objetivo
              <select
                value={form.goalType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    goalType: event.target.value,
                  }))
                }
              >
                <option value="weight">Peso corporal</option>
                <option value="muscle">Masa muscular</option>
                <option value="body_fat">Grasa corporal</option>
                <option value="endurance">Resistencia</option>
                <option value="strength">Fuerza</option>
                <option value="custom">Personalizado</option>
              </select>
            </label>
          )}

          <label>
            Descripción
            <textarea
              value={form.description ?? ""}
              maxLength={500}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Ejemplo: mejorar mi condición física"
            />
          </label>

          <div className="member-goals-fields">
            <label>
              Valor actual
              <input
                type="number"
                step="any"
                value={form.currentValue ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currentValue: event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  }))
                }
              />
            </label>

            <label>
              Valor objetivo
              <input
                type="number"
                step="any"
                value={form.targetValue ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    targetValue: event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  }))
                }
              />
            </label>

            <label>
              Unidad
              <input
                type="text"
                maxLength={20}
                value={form.unit ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unit: event.target.value,
                  }))
                }
                placeholder="kg, %, km..."
              />
            </label>

            <label>
              Fecha límite
              <input
                type="date"
                value={form.targetDate ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    targetDate: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="member-goals-actions">
            <Button type="submit" loading={isSaving}>
              {editingGoal ? "Guardar cambios" : "Crear objetivo"}
            </Button>

            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {goalsQuery.isLoading && <p>Cargando objetivos...</p>}

      {goalsQuery.isError && (
        <Alert
          type="error"
          message="No pudimos cargar tus objetivos."
        />
      )}

      {goalsQuery.isSuccess && goals.length === 0 && (
        <div className="member-goals-empty">
          <p>Todavía no tienes objetivos registrados.</p>
          <p>¡Crea tu primera meta fitness!</p>
        </div>
      )}

      <div className="member-goals-list">
        {goals.map((goal) => (
          <article className="member-goal-item" key={goal.id}>
            <div className="member-goal-heading">
              <div>
                <h3>{getGoalLabel(goal.goalType)}</h3>
                <span className={`member-goal-status member-goal-status--${goal.status}`}>
                  {getStatusLabel(goal.status)}
                </span>
              </div>
            </div>

            {goal.description && <p>{goal.description}</p>}

            <div className="member-goal-values">
              {goal.currentValue !== undefined && (
                <span>Actual: {goal.currentValue} {goal.unit}</span>
              )}
              {goal.targetValue !== undefined && (
                <span>Meta: {goal.targetValue} {goal.unit}</span>
              )}
            </div>

            {goal.targetDate && (
              <p className="member-goal-date">
                Fecha límite: {goal.targetDate.slice(0, 10)}
              </p>
            )}

            <div className="member-goals-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => beginEdit(goal)}
              >
                Editar
              </Button>

              {goal.status === "in_progress" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void changeStatus(goal, "achieved")}
                >
                  Completar
                </Button>
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={() => void removeGoal(goal)}
              >
                Eliminar
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}