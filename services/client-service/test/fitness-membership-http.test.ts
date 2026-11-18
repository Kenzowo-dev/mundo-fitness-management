import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  getClientByUserId: vi.fn(),
  requireMembership: vi.fn(),
  createPlan: vi.fn(),
  completeWorkout: vi.fn(),
}));

vi.mock("../src/services/client.service.js", () => ({
  getClientByUserId: mocks.getClientByUserId,
}));

vi.mock("../src/services/fitness.service.js", () => ({
  requireActiveFitnessMembership: mocks.requireMembership,
  createFitnessPlan: mocks.createPlan,
  completeFitnessWorkout: mocks.completeWorkout,
}));

import {
  createFitnessPlanController,
  completeFitnessWorkoutController,
} from "../src/controllers/fitness.controller.js";

import { AuthorizationError } from "@gym/shared/errors/index.js";

const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  (req as typeof req & { user: unknown }).user = {
    sub: "42",
    role: "member",
  };
  next();
});

app.post("/fitness/plans", createFitnessPlanController);
app.post("/fitness/sessions/:id/complete", completeFitnessWorkoutController);

app.use((
  error: Error & { statusCode?: number; code?: string },
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  res.status(error.statusCode ?? 500).json({
    error: {
      message: error.message,
      code: error.code ?? "INTERNAL_ERROR",
    },
  });
});

describe("Fitness membership HTTP authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mocks.getClientByUserId.mockResolvedValue({ id: 7 });
  });

  it("rechaza generar un plan sin membresia vigente", async () => {
    mocks.requireMembership.mockRejectedValue(
      new AuthorizationError(
        "Necesitas una membresia vigente",
        "ACTIVE_MEMBERSHIP_REQUIRED",
      ),
    );

    const response = await request(app)
      .post("/fitness/plans");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ACTIVE_MEMBERSHIP_REQUIRED");
    expect(mocks.createPlan).not.toHaveBeenCalled();
  });

  it("permite generar un plan con membresia vigente", async () => {
    mocks.requireMembership.mockResolvedValue(undefined);
    mocks.createPlan.mockResolvedValue({ id: 15 });

    const response = await request(app)
      .post("/fitness/plans");

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(15);
    expect(mocks.createPlan).toHaveBeenCalledWith(7);
  });

  it("rechaza registrar entrenamiento sin membresia vigente", async () => {
    mocks.requireMembership.mockRejectedValue(
      new AuthorizationError(
        "Necesitas una membresia vigente",
        "ACTIVE_MEMBERSHIP_REQUIRED",
      ),
    );

    const response = await request(app)
      .post("/fitness/sessions/10/complete")
      .send({ durationMinutes: 30 });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ACTIVE_MEMBERSHIP_REQUIRED");
    expect(mocks.completeWorkout).not.toHaveBeenCalled();
  });

  it("permite registrar entrenamiento con membresia vigente", async () => {
    mocks.requireMembership.mockResolvedValue(undefined);
    mocks.completeWorkout.mockResolvedValue({ id: 25 });

    const response = await request(app)
      .post("/fitness/sessions/10/complete")
      .send({ durationMinutes: 30 });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(25);
    expect(mocks.completeWorkout).toHaveBeenCalledWith(
      7,
      10,
      { durationMinutes: 30 },
    );
  });

  it.each(["2026-02-30", "2026-2-01", "0000-01-01"])(
    "rechaza la fecha inválida %s antes de guardar",
    async (performedOn) => {
      const response = await request(app)
        .post("/fitness/sessions/10/complete")
        .send({ performedOn });

      expect(response.status).toBe(400);
      expect(mocks.completeWorkout).not.toHaveBeenCalled();
    },
  );

  it("admite fechas retroactivas dentro de la ventana de Lima", async () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    const performedOn = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(yesterday);
    mocks.completeWorkout.mockResolvedValue({ performedOn });

    const response = await request(app)
      .post("/fitness/sessions/10/complete")
      .send({ performedOn });

    expect(response.status).toBe(201);
    expect(mocks.completeWorkout).toHaveBeenCalledWith(7, 10, { performedOn });
  });

  it.each([-14, 1])("rechaza fechas fuera de la ventana de Lima (%s días)", async (offset) => {
    const date = new Date(Date.now() + offset * 86_400_000);
    const performedOn = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

    const response = await request(app)
      .post("/fitness/sessions/10/complete")
      .send({ performedOn });

    expect(response.status).toBe(400);
    expect(mocks.completeWorkout).not.toHaveBeenCalled();
  });
});
