import { useState } from "react";
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

const avoidedExerciseOptions = [
  { value: "chair-squat", label: "Sentadilla a una silla" },
  { value: "bodyweight-squat", label: "Sentadilla con peso corporal" },
  { value: "wall-pushup", label: "Flexiones contra la pared" },
  { value: "pushup", label: "Flexiones de brazos" },
  { value: "glute-bridge", label: "Puente de glúteos" },
  { value: "bird-dog", label: "Bird dog" },
  { value: "dumbbell-row", label: "Remo con mancuerna" },
  { value: "dumbbell-press", label: "Press de hombros con mancuernas" },
  { value: "lat-pulldown", label: "Jalón al pecho" },
  { value: "leg-press", label: "Prensa de piernas" },
  { value: "walking", label: "Caminata" },
  { value: "stationary-bike", label: "Bicicleta estática" },
];

export default function FitnessPreferencesForm({
  initialValues,
  onSave,
  saving = false,
}: FitnessPreferencesFormProps) {
  const [values, setValues] = useState<FitnessProfileInput>(
    initialValues,
  );
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setError("No se pudieron guardar las preferencias.");
    }
  };

  return (
    <form
      className="member-profile-form"
      onSubmit={(event) => void handleSubmit(event)}
    >
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
          {values.daysPerWeek} días por semana
        </p>
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
        {avoidedExerciseOptions.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={(values.avoidedExerciseIds ?? []).includes(
                option.value,
              )}
              onChange={() =>
                toggleArrayValue("avoidedExerciseIds", option.value)
              }
            />
            {" "}{option.label}
          </label>
        ))}
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
