import { Router } from "express";

import { authenticate, authorize } from "../middleware/auth.middleware.js";

import {
  getFitnessProfileController,
  saveFitnessProfileController,
  createFitnessPlanController,
  getFitnessPlansController,
  getFitnessPlanByIdController,
  completeFitnessWorkoutController,
  getFitnessWorkoutHistoryController,
} from "../controllers/fitness.controller.js";

const router: Router = Router();

router.use(authenticate, authorize("member"));

router.get("/profile", getFitnessProfileController);
router.put("/profile", saveFitnessProfileController);

router.post("/plans", createFitnessPlanController);
router.get("/plans", getFitnessPlansController);
router.get("/plans/:id", getFitnessPlanByIdController);

router.post(
  "/sessions/:id/complete",
  completeFitnessWorkoutController,
);

router.get("/history", getFitnessWorkoutHistoryController);

export default router;
