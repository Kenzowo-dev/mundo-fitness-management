import { describe, expect, it } from "vitest";
import type { FitnessWorkoutLog, FitnessWorkoutSession } from "../../types/fitness";
import { getFitnessWeek, getLimaDate } from "./fitnessSchedule";

const sessions: FitnessWorkoutSession[] = [7, 3, 1].map((day) => ({
  id: day, dayNumber: day, planId: 1, title: "Entrenamiento",
  estimatedMinutes: 45, warmup: [], cooldown: [], exercises: [],
}));

function log(sessionId: number, performedOn?: string): FitnessWorkoutLog {
  return { id: sessionId, sessionId, performedOn, clientId: 2, completedAt: "2026-11-18T00:00:00Z" };
}

describe("Semana fitness en Lima", () => {
  it("cambia de semana el lunes a medianoche local", () => {
    const sunday = getLimaDate(new Date("2026-11-16T04:59:59Z"));
    const monday = getLimaDate(new Date("2026-11-16T05:00:00Z"));
    expect(getFitnessWeek([], [], sunday)).toMatchObject({ start: "2026-11-09", end: "2026-11-15" });
    expect(getFitnessWeek([], [], monday)).toMatchObject({ start: "2026-11-16", end: "2026-11-22" });
  });

  it("usa la fecha real aunque difiera de la fecha programada", () => {
    const { entries } = getFitnessWeek(sessions, [
      log(3, "2026-11-17"),
      log(1, "2026-11-15"),
      log(1),
      log(7, "2026-11-22"),
      log(99, "2026-11-17"),
    ], "2026-11-18");

    expect(entries.map(({ status }) => status)).toEqual(["Pendiente", "Completado", "Programado"]);
    expect(entries[1]).toMatchObject({
      scheduledOn: "2026-11-18",
      performedDates: ["2026-11-17"],
    });
  });
});
