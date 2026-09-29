import { Router } from 'express';
import {
  createExerciseController,
  getExerciseController,
  listExercisesController,
  updateExerciseController,
  createPlanController,
  getPlanController,
  listPlansController,
  updatePlanController,
  deletePlanController,
  assignPlanController,
  getClientPlansController,
  getActivePlanController,
  updateProgressController,
  completePlanController,
  logWorkoutController,
  getWorkoutLogsController,
  getWorkoutLogController,
  createExerciseValidation,
  createPlanValidation,
  assignPlanValidation,
  logWorkoutValidation,
  updateProgressValidation,
} from '../controllers/plan.controller.js';
import { authenticate, authorize, requireClientAccess, requireClientPlanAccess } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.get('/exercises', authenticate, listExercisesController);
router.get('/exercises/:id', authenticate, getExerciseController);
router.post('/exercises', authenticate, authorize('admin', 'trainer'), createExerciseValidation, createExerciseController);
router.patch('/exercises/:id', authenticate, authorize('admin', 'trainer'), updateExerciseController);

router.get('/plans', authenticate, listPlansController);
router.get('/plans/:id', authenticate, getPlanController);
router.post('/plans', authenticate, authorize('admin', 'trainer'), createPlanValidation, createPlanController);
router.patch('/plans/:id', authenticate, authorize('admin', 'trainer'), updatePlanController);
router.delete('/plans/:id', authenticate, authorize('admin'), deletePlanController);

router.post('/assign', authenticate, authorize('admin', 'trainer'), assignPlanValidation, assignPlanController);
router.get('/client/:clientId', authenticate, requireClientAccess, getClientPlansController);
router.get('/client/:clientId/active', authenticate, requireClientAccess, getActivePlanController);
router.patch('/client-plans/:clientPlanId/progress', authenticate, authorize('admin', 'trainer'), requireClientPlanAccess, updateProgressValidation, updateProgressController);
router.post('/client-plans/:clientPlanId/complete', authenticate, authorize('admin', 'trainer'), requireClientPlanAccess, completePlanController);

router.post('/logs', authenticate, logWorkoutValidation, logWorkoutController);
router.get('/logs/client-plan/:clientPlanId', authenticate, requireClientPlanAccess, getWorkoutLogsController);
router.get('/logs/:logId', authenticate, getWorkoutLogController);

export default router;