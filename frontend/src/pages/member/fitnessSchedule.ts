import type { FitnessWorkoutLog, FitnessWorkoutSession } from "../../types/fitness";

export const FITNESS_WEEKDAYS = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
];

export function defaultFitnessTrainingDays(frequency: number): number[] {
  return [1, 3, 5, 2, 4, 6, 7].slice(0, frequency).sort((a, b) => a - b);
}

export function getLimaDate(instant = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function shiftFitnessDate(day: string, offset: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function getFitnessWeek(
  sessions: FitnessWorkoutSession[],
  logs: FitnessWorkoutLog[],
  today = getLimaDate(),
) {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay() || 7;
  const start = shiftFitnessDate(today, 1 - weekday);
  const end = shiftFitnessDate(start, 6);

  const entries = [...sessions].sort((a, b) => a.dayNumber - b.dayNumber)
    .map((session) => {
      const scheduledOn = shiftFitnessDate(start, session.dayNumber - 1);
      const performedDates = logs
        .filter((log) => log.sessionId === session.id)
        .flatMap(({ performedOn }) =>
          performedOn && performedOn >= start && performedOn <= today ? [performedOn] : [],
        )
        .sort();
      const status = performedDates.length > 0
        ? "Completado"
        : scheduledOn <= today ? "Pendiente" : "Programado";
      return { session, scheduledOn, performedDates, status };
    });

  return { start, end, entries };
}
