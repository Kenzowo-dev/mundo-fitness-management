import { useState } from "react";
import { useOwnMeasurements } from "../../hooks/useApi";
import type { ClientMeasurement } from "../../types/api";
import "@/styles/member/MemberProgressCharts.css";

type Metric = {
  key: keyof ClientMeasurement;
  label: string;
  unit: string;
};

const metrics: Metric[] = [
  { key: "weightKg", label: "Peso corporal", unit: "kg" },
  { key: "bodyFatPercentage", label: "Grasa corporal", unit: "%" },
  { key: "muscleMassKg", label: "Masa muscular", unit: "kg" },
  { key: "waistCm", label: "Cintura", unit: "cm" },
  { key: "chestCm", label: "Pecho", unit: "cm" },
  { key: "hipsCm", label: "Cadera", unit: "cm" },
];

export default function MemberProgressCharts() {
  const measurementsQuery = useOwnMeasurements();
  const [selectedMetric, setSelectedMetric] = useState("weightKg");

  const metric = metrics.find(
    (item) => item.key === selectedMetric
  ) ?? metrics[0];

  const points = (measurementsQuery.data ?? [])
    .filter((measurement) => {
      const value = measurement[metric.key];
      return typeof value === "number" && Number.isFinite(value);
    })
    .map((measurement) => ({
      date: measurement.measuredAt,
      value: measurement[metric.key] as number,
    }))
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  const values = points.map((point) => point.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const padding = Math.max((max - min) * 0.15, 1);
  const lower = min - padding;
  const upper = max + padding;

  const width = 640;
  const height = 240;
  const left = 50;
  const right = 20;
  const top = 20;
  const bottom = 40;

  const x = (index: number) =>
    left +
    (points.length <= 1
      ? (width - left - right) / 2
      : (index / (points.length - 1)) * (width - left - right));

  const y = (value: number) =>
    top +
    (1 - (value - lower) / (upper - lower)) *
      (height - top - bottom);

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.value)}`
    )
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];
  const difference = first && last ? last.value - first.value : null;

  return (
    <section className="member-card member-progress" id="progress">
      <header className="member-section-header">
        <div>
          <h2>Mi progreso físico</h2>
          <p>Consulta la evolución de tus mediciones.</p>
        </div>
      </header>

      <div className="member-progress-toolbar">
        <label htmlFor="progress-metric">Medición</label>
        <select
          id="progress-metric"
          value={selectedMetric}
          onChange={(event) => setSelectedMetric(event.target.value)}
        >
          {metrics.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {measurementsQuery.isLoading && <p>Cargando progreso...</p>}

      {measurementsQuery.isError && (
        <p role="alert">No pudimos cargar tus mediciones.</p>
      )}

      {measurementsQuery.isSuccess && points.length === 0 && (
        <p>Aún no tienes mediciones de {metric.label.toLowerCase()}.</p>
      )}

      {measurementsQuery.isSuccess && points.length > 0 && (
        <>
          <div className="member-progress-stats">
            <div>
              <span>Primera medición</span>
              <strong>{first.value} {metric.unit}</strong>
            </div>
            <div>
              <span>Última medición</span>
              <strong>{last.value} {metric.unit}</strong>
            </div>
            <div>
              <span>Variación</span>
              <strong>
                {difference !== null && difference > 0 ? "+" : ""}
                {difference?.toFixed(1)} {metric.unit}
              </strong>
            </div>
          </div>

          <div className="member-progress-chart">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`Evolución de ${metric.label.toLowerCase()} con ${points.length} mediciones`}
            >
              {[0, 1, 2, 3, 4].map((index) => {
                const value = lower + ((upper - lower) * (4 - index)) / 4;
                const lineY = y(value);

                return (
                  <g key={index}>
                    <line
                      x1={left}
                      y1={lineY}
                      x2={width - right}
                      y2={lineY}
                      stroke="currentColor"
                      opacity="0.12"
                    />
                    <text
                      x={left - 8}
                      y={lineY + 4}
                      textAnchor="end"
                      fill="currentColor"
                      fontSize="11"
                    >
                      {value.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              <path
                d={path}
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {points.map((point, index) => (
                <circle
                  key={`${point.date}-${index}`}
                  cx={x(index)}
                  cy={y(point.value)}
                  r="4"
                  fill="#f97316"
                  stroke="#fff"
                  strokeWidth="1"
                >
                  <title>
                    {new Date(point.date).toLocaleDateString("es-PE")}
                    {`: ${point.value} ${metric.unit}`}
                  </title>
                </circle>
              ))}
            </svg>
          </div>

          <p className="member-progress-caption">
            {points.length} medición(es) registradas. La variación
            indica el cambio numérico, no necesariamente una mejora.
          </p>
        </>
      )}
    </section>
  );
}