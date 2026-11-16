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
});
