import { useState, type FormEvent } from "react";
import { useAddOwnMeasurement, useOwnMeasurements } from "../../hooks/useApi";
import type { CreateOwnMeasurementInput } from "../../types/api";
import Button from "../Button";
import Alert from "../Alert";
import { numberInputGuards } from "../../utils/fieldValidation";
import "../../styles/member/MemberPhysicalProfile.css";

const decimalGuards = numberInputGuards(true);

type NumericField = Exclude<keyof CreateOwnMeasurementInput, "notes">;

const measurementFields: {
  key: NumericField;
  label: string;
  unit: string;
  max: number;
}[] = [
  { key: "weightKg", label: "Peso", unit: "kg", max: 500 },
  { key: "heightCm", label: "Altura", unit: "cm", max: 300 },
  { key: "bodyFatPercentage", label: "Grasa corporal", unit: "%", max: 100 },
  { key: "muscleMassKg", label: "Masa muscular", unit: "kg", max: 200 },
  { key: "chestCm", label: "Pecho", unit: "cm", max: 200 },
  { key: "waistCm", label: "Cintura", unit: "cm", max: 200 },
  { key: "hipsCm", label: "Cadera", unit: "cm", max: 200 },
  { key: "bicepCm", label: "Bíceps", unit: "cm", max: 100 },
  { key: "thighCm", label: "Muslo", unit: "cm", max: 100 },
];

const initialValues = Object.fromEntries(
  measurementFields.map(({ key }) => [key, ""]),
) as Record<NumericField, string>;

export default function MemberPhysicalProfile() {
  const measurementsQuery = useOwnMeasurements();
  const addMeasurement = useAddOwnMeasurement();

  const [form, setForm] = useState(initialValues);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const measurements = measurementsQuery.data ?? [];

  const latestValues = Object.fromEntries(
    measurementFields.map(({ key }) => [
      key,
      measurements.find((measurement) => measurement[key] != null)?.[key],
    ]),
  ) as Partial<Record<NumericField, number>>;

  const weightKg = latestValues.weightKg;
  const heightCm = latestValues.heightCm;

  const bmi =
    weightKg != null && heightCm != null && heightCm > 0
      ? weightKg / (heightCm / 100) ** 2
      : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const data: CreateOwnMeasurementInput = {};

    for (const field of measurementFields) {
      const rawValue = form[field.key].trim();

      if (!rawValue) continue;

      const value = Number(rawValue);

      if (!Number.isFinite(value) || value <= 0 || value > field.max) {
        setError(`Revisa el valor de ${field.label.toLowerCase()}.`);
        return;
      }

      data[field.key] = value;
    }

    if (Object.keys(data).length === 0) {
      setError("Introduce al menos una medida corporal.");
      return;
    }

    if (notes.trim()) {
      data.notes = notes.trim();
    }

    try {
      await addMeasurement.mutateAsync(data);
      setForm({ ...initialValues });
      setNotes("");
      setMessage("Tus mediciones se guardaron correctamente.");
    } catch {
      setError("No pudimos guardar las mediciones. Inténtalo de nuevo.");
    }
  };

  return (
    <section className="member-physical" id="measurements">
      <header className="member-physical__heading">
        <div>
          <h2>Mi progreso físico</h2>
          <p className="member-physical__subtitle">
            Consulta tu evolución y registra tus medidas corporales.
          </p>
        </div>
      </header>

      {measurementsQuery.isLoading && <p>Cargando tus mediciones...</p>}

      {measurementsQuery.isError && (
        <Alert type="error" message="No pudimos cargar tus mediciones." />
      )}

      {message && (
        <Alert
          type="success"
          message={message}
          dismissible
          onDismiss={() => setMessage(null)}
        />
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      <div className="member-physical__stats">
        <div className="member-physical__stat">
          <span className="member-physical__stat-label">Peso actual</span>
          <strong className="member-physical__stat-value">
            {weightKg != null ? weightKg : "—"}
          </strong>
          <span className="member-physical__stat-unit">kg</span>
        </div>

        <div className="member-physical__stat">
          <span className="member-physical__stat-label">Altura</span>
          <strong className="member-physical__stat-value">
            {heightCm != null ? heightCm : "—"}
          </strong>
          <span className="member-physical__stat-unit">cm</span>
        </div>

        <div className="member-physical__stat">
          <span className="member-physical__stat-label">
            Índice de masa corporal
          </span>
          <strong className="member-physical__stat-value">
            {bmi != null ? bmi.toFixed(1) : "—"}
          </strong>
          <span className="member-physical__stat-unit">IMC</span>
        </div>
      </div>

      <section className="member-physical__section">
        <h3 className="member-physical__section-title">
          Mis medidas corporales
        </h3>

        <dl className="member-physical__measurements">
          {measurementFields.map(({ key, label, unit }) => (
            <div className="member-physical__measurement" key={key}>
              <dt>{label}</dt>
              <dd>
                {latestValues[key] != null
                  ? `${latestValues[key]} ${unit}`
                  : "Sin registrar"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="member-physical__section">
        <h3 className="member-physical__section-title">
          Registrar nuevas mediciones
        </h3>

        <form className="member-physical__form" onSubmit={handleSubmit}>
          {measurementFields.map(({ key, label, unit, max }) => (
            <div className="member-physical__field" key={key}>
              <label htmlFor={`measurement-${key}`}>
                {label} ({unit})
              </label>

              <input
                id={`measurement-${key}`}
                type="number"
                min="0.1"
                max={max}
                step="any"
                {...decimalGuards}
                value={form[key]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                placeholder={`Ingresa ${label.toLowerCase()}`}
              />
            </div>
          ))}

          <div className="member-physical__field member-physical__field--full">
            <label htmlFor="measurement-notes">Observaciones (opcional)</label>

            <textarea
              id="measurement-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ejemplo: medición realizada por la mañana"
            />
          </div>

          <div className="member-physical__actions">
            <Button type="submit" loading={addMeasurement.isPending}>
              Guardar mediciones
            </Button>
          </div>
        </form>
      </section>

      <section className="member-physical__section">
        <h3 className="member-physical__section-title">
          Historial de mediciones
        </h3>

        {measurementsQuery.isSuccess && measurements.length === 0 && (
          <p className="member-physical__empty">
            Todavía no tienes mediciones registradas.
          </p>
        )}

        <div className="member-physical__history">
          {measurements.map((measurement) => (
            <article
              className="member-physical__history-item"
              key={measurement.id}
            >
              <time
                className="member-physical__history-date"
                dateTime={measurement.measuredAt}
              >
                {new Date(measurement.measuredAt).toLocaleDateString("es-PE")}
              </time>

              <dl className="member-physical__history-values">
                {measurementFields
                  .filter(({ key }) => measurement[key] != null)
                  .map(({ key, label, unit }) => (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>
                        {measurement[key]} {unit}
                      </dd>
                    </div>
                  ))}
              </dl>

              {measurement.notes && (
                <p className="member-physical__history-notes">
                  {measurement.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
