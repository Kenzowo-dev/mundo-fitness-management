import { useState } from "react";
import { defaultFitnessTrainingDays, FITNESS_WEEKDAYS } from "./fitnessSchedule";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import FormField from "../../components/FormField";
import Button from "../../components/Button";
import type {
  FitnessProfileInput,
  FitnessGoal,
  FitnessLevel,
  TrainingLocation,
} from "../../types/fitness";

interface FitnessPreferencesFormProps {
  initialValues: FitnessProfileInput;
  onSave: (values: FitnessProfileInput) => Promise<void>;
  saving?: boolean;
}

const goalOptions = [
  { value: "weight", label: "Control de peso" },
  { value: "muscle", label: "Ganar masa muscular" },
  { value: "body_fat", label: "Reducir grasa corporal" },
  { value: "endurance", label: "Mejorar resistencia" },
  { value: "strength", label: "Aumentar fuerza" },
  { value: "general", label: "Bienestar general" },
];

const levelOptions = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

const locationOptions = [
  { value: "home", label: "En casa" },
  { value: "gym", label: "En el gimnasio" },
  { value: "both", label: "Casa y gimnasio" },
];

const intensityOptions = [
  { value: "light", label: "Ligera" },
  { value: "moderate", label: "Moderada" },
  { value: "intense", label: "Intensa" },
];

const equipmentOptions = [
  { value: "chair", label: "Silla estable" },
  { value: "dumbbells", label: "Mancuernas" },
  { value: "machines", label: "Máquinas de gimnasio" },
  { value: "stationary_bike", label: "Bicicleta estática" },
];

const exerciseTypeOptions = [
  { value: "strength", label: "Fuerza" },
  { value: "cardio", label: "Cardio" },
  { value: "mobility", label: "Movilidad" },
] as const;



export default function FitnessPreferencesForm({
  initialValues,
  onSave,
  saving = false,
}: FitnessPreferencesFormProps) {
  const [values, setValues] = useState<FitnessProfileInput>(
    () => ({
      ...initialValues,
      trainingDays: initialValues.trainingDays ?? defaultFitnessTrainingDays(initialValues.daysPerWeek),
    }),
  );
  const [error, setError] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState<
    "all" | "strength" | "cardio" | "mobility"
  >("all");

  const catalogQuery = useQuery({
    queryKey: ["fitness", "catalog"],
    queryFn: () => api.getOwnFitnessCatalog(),
    staleTime: 60 * 60 * 1000,
  });

  const visibleExercises = [...(catalogQuery.data ?? [])]
    .filter((exercise) =>
      (exerciseCategory === "all" ||
        exercise.category === exerciseCategory) &&
      exercise.name
        .toLocaleLowerCase("es")
        .includes(exerciseSearch.trim().toLocaleLowerCase("es")),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const update = <K extends keyof FitnessProfileInput>(
    field: K,
    value: FitnessProfileInput[K],
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleArrayValue = (
    field: "equipment" | "preferredExerciseTypes" | "avoidedExerciseIds",
    value: string,
  ) => {
    setValues((current) => {
      const existing: string[] = current[field] ?? [];
      const next = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];

      return {
        ...current,
        [field]: next,
      };
    });
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError(null);

    if (
      !Number.isInteger(values.daysPerWeek) ||
      values.daysPerWeek < 1 ||
      values.daysPerWeek > 7
    ) {
      setError("Selecciona entre 1 y 7 días por semana.");
      return;
    }

    if (values.trainingDays?.length !== values.daysPerWeek) {
      setError(`Selecciona exactamente ${values.daysPerWeek} días de entrenamiento.`);
      return;
    }

    if (
      !Number.isInteger(values.sessionMinutes) ||
      values.sessionMinutes < 15 ||
      values.sessionMinutes > 120
    ) {
      setError("La duración debe estar entre 15 y 120 minutos.");
      return;
    }

    try {
      await onSave(values);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudieron guardar las preferencias.");
    }
  };

  return (
    <form
      className="member-profile-form fitness-preferences-form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <header className="fitness-section-heading">
        <span className="fitness-section-number">01</span>
        <div>
          <h3>Define tu objetivo</h3>
          <p>Cuéntanos qué quieres conseguir y cómo prefieres entrenar.</p>
        </div>
      </header>

      <FormField
        id="fitness-goal"
        label="Objetivo principal"
        type="select"
        value={values.preferredGoal}
        options={goalOptions}
        onChange={(value) =>
          update("preferredGoal", value as FitnessGoal)
        }
        required
      />

      <FormField
        id="fitness-level"
        label="Nivel de experiencia"
        type="select"
        value={values.fitnessLevel}
        options={levelOptions}
        onChange={(value) =>
          update("fitnessLevel", value as FitnessLevel)
        }
        required
      />

      <FormField
        id="fitness-location"
        label="Lugar de entrenamiento"
        type="select"
        value={values.trainingLocation}
        options={locationOptions}
        onChange={(value) =>
          update("trainingLocation", value as TrainingLocation)
        }
        required
      />

      <header className="fitness-section-heading">
        <span className="fitness-section-number">02</span>
        <div>
          <h3>Organiza tu entrenamiento</h3>
          <p>Elige tu frecuencia semanal, duración e intensidad.</p>
        </div>
      </header>

      <fieldset className="fitness-preferences-group fitness-days-group">
        <legend>Días de entrenamiento por semana</legend>

        <div className="fitness-days-selector">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <button
              key={day}
              type="button"
              className={`fitness-day-button ${
                values.daysPerWeek === day ? "is-selected" : ""
              }`}
              aria-pressed={values.daysPerWeek === day}
              onClick={() => update("daysPerWeek", day)}
            >
              {day}
            </button>
          ))}
        </div>

        <p className="fitness-control-help">
          {(values.trainingDays ?? []).length} de {values.daysPerWeek} días seleccionados
        </p>
      </fieldset>

      <fieldset className="fitness-preferences-group">
        <legend>¿Qué días vas a entrenar?</legend>
        <div className="fitness-weekday-picker">
          {FITNESS_WEEKDAYS.map((name, index) => {
            const day = index + 1;
            const selected = (values.trainingDays ?? []).includes(day);
            return (
              <button
                key={day}
                type="button"
                className={`fitness-day-button ${selected ? "is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => {
                  const days = values.trainingDays ?? [];
                  update("trainingDays", selected
                    ? days.filter((value) => value !== day)
                    : [...days, day].sort((a, b) => a - b));
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="fitness-duration-group">
        <label htmlFor="fitness-duration">
          Duración por sesión
        </label>

        <div className="fitness-duration-value">
          {values.sessionMinutes} minutos
        </div>

        <input
          id="fitness-duration"
          type="range"
          min={15}
          max={120}
          step={5}
          value={values.sessionMinutes}
          onChange={(event) =>
            update("sessionMinutes", Number(event.target.value))
          }
        />

        <div className="fitness-duration-limits">
          <span>15 min</span>
          <span>120 min</span>
        </div>
      </div>
      <FormField
        id="fitness-intensity"
        label="Intensidad preferida"
        type="select"
        value={values.preferredIntensity ?? "moderate"}
        options={intensityOptions}
        onChange={(value) =>
          update(
            "preferredIntensity",
            value as "light" | "moderate" | "intense",
          )
        }
      />

      <header className="fitness-section-heading">
        <span className="fitness-section-number">03</span>
        <div>
          <h3>Personaliza tu rutina</h3>
          <p>Selecciona tu equipamiento y los ejercicios que prefieres realizar o evitar.</p>
        </div>
      </header>

      <fieldset className="fitness-preferences-group fitness-option-cards fitness-equipment-options">
        <legend>Equipamiento disponible</legend>
        {equipmentOptions.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={values.equipment.includes(option.value)}
              onChange={() =>
                toggleArrayValue("equipment", option.value)
              }
            />
            {" "}{option.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="fitness-preferences-group fitness-option-cards fitness-exercise-type-options">
        <legend>Tipos de ejercicios preferidos</legend>
        {exerciseTypeOptions.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={(values.preferredExerciseTypes ?? []).includes(
                option.value,
              )}
              onChange={() =>
                toggleArrayValue("preferredExerciseTypes", option.value)
              }
            />
            {" "}{option.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="fitness-preferences-group fitness-option-cards fitness-avoided-options">
        <legend>Ejercicios que deseas evitar</legend>

        <div className="fitness-catalog-toolbar">
          <input
            type="search"
            aria-label="Buscar ejercicios por nombre"
            placeholder="Buscar ejercicio..."
            value={exerciseSearch}
            onChange={(event) => setExerciseSearch(event.target.value)}
          />

          <select
            aria-label="Filtrar ejercicios por categoría"
            value={exerciseCategory}
            onChange={(event) =>
              setExerciseCategory(event.target.value as
                "all" | "strength" | "cardio" | "mobility")
            }
          >
            <option value="all">Todas las categorías</option>
            <option value="strength">Fuerza</option>
            <option value="cardio">Cardio</option>
            <option value="mobility">Movilidad</option>
          </select>
        </div>

        <p className="fitness-catalog-count" aria-live="polite">
          {visibleExercises.length} de {catalogQuery.data?.length ?? 0}
          {" "}ejercicios ·{" "}
          {(values.avoidedExerciseIds ?? []).length} excluidos
        </p>

        {catalogQuery.isPending && (
          <p role="status">Cargando catálogo de ejercicios...</p>
        )}

        {catalogQuery.isError && (
          <div className="fitness-catalog-error">
            <p>No pudimos cargar el catálogo de ejercicios.</p>
            <button
              type="button"
              onClick={() => void catalogQuery.refetch()}
            >
              Reintentar
            </button>
          </div>
        )}

        {catalogQuery.isSuccess && (
          <div className="fitness-catalog-list">
            {visibleExercises.map((option) => (
              <label key={option.id}>
                <input
                  type="checkbox"
                  checked={(values.avoidedExerciseIds ?? []).includes(
                    option.id,
                  )}
                  onChange={() =>
                    toggleArrayValue("avoidedExerciseIds", option.id)
                  }
                />
                {option.name}
              </label>
            ))}

            {visibleExercises.length === 0 && (
              <p>No se encontraron ejercicios con ese filtro.</p>
            )}
          </div>
        )}
      </fieldset>

      <FormField
        id="fitness-mobility"
        label="Limitaciones de movilidad (opcional)"
        type="textarea"
        maxLength={1000}
        value={values.mobilityNotes ?? ""}
        onChange={(value) =>
          update("mobilityNotes", value || null)
        }
        helperText="Si registras una limitación, la generación automática requerir? una evaluación previa."
      />

      {error && (
        <p role="alert" className="form-field-error-message">
          {error}
        </p>
      )}

      <div className="member-profile-actions">
        <Button
          type="submit"
          loading={saving}
          disabled={saving}
        >
          Guardar preferencias
        </Button>
      </div>
    </form>
  );
}
