
import { Router } from 'express';
import {
  addOwnMeasurementController,
  getOwnMeasurementsController,
  createClientController,
  getClientController,
  getClientByDniController,
  getClientByUserIdController,
  updateClientController,
  updateOwnClientController,
  deleteClientController,
  listClientsController,
  getClientStatsController,
  getClientReportsController,
  addMeasurementController,
  ownMeasurementValidation,
  getClientMeasurementsController,
  getLatestMeasurementController,
  createGoalController,
  getClientGoalsController,
  updateGoalController,
  deleteGoalController,
  addDocumentController,
  getClientDocumentsController,
  deleteDocumentController,
  createClientValidation,
  updateClientValidation,
  updateOwnClientValidation,
  measurementValidation,
  goalValidation,
  updateGoalValidation,
  documentValidation,
  createOwnGoalController,
  getOwnGoalsController,
  updateOwnGoalController,
  deleteOwnGoalController,
  ownGoalValidation,
} from '../controllers/client.controller.js';

import {
  authenticate,
  authorize,
  requireClientAccess,
  requireUserSelf,
} from '../middleware/auth.middleware.js';
import {
  uploadAvatarMiddleware,
  uploadAvatarController,
  getAvatarController,
  deleteAvatarController,
} from '../controllers/avatar.controller.js';

const router: Router = Router();

// ==================================================
// GESTIÓN DE CLIENTES
// ==================================================

router.post(
  '/',
  authenticate,
  authorize('admin', 'receptionist'),
  createClientValidation,
  createClientController
);

router.get(
  '/',
  authenticate,
  authorize('admin', 'receptionist'),
  listClientsController
);

router.get(
  '/stats',
  authenticate,
  authorize('admin', 'receptionist'),
  getClientStatsController
);

router.get(
  '/reports',
  authenticate,
  authorize('admin', 'receptionist'),
  getClientReportsController
);

router.get(
  '/dni/:dni',
  authenticate,
  authorize('admin', 'receptionist'),
  getClientByDniController
);

// ==================================================
// PERFIL DEL SOCIO AUTENTICADO
// ==================================================

router.get(
  '/user/:userId',
  authenticate,
  requireUserSelf,
  getClientByUserIdController
);

router.patch(
  '/user/:userId',
  authenticate,
  requireUserSelf,
  updateOwnClientValidation,
  updateOwnClientController
);

// ==================================================
// FOTOGRAFÍA DEL SOCIO AUTENTICADO
// ==================================================

router.post(
  '/me/avatar',
  authenticate,
  uploadAvatarMiddleware,
  uploadAvatarController
);

router.get(
  '/me/avatar',
  authenticate,
  getAvatarController
);

router.delete(
  '/me/avatar',
  authenticate,
  deleteAvatarController
);

// ==================================================
// MEDICIONES DEL SOCIO AUTENTICADO
// IMPORTANTE: antes de /:clientId/measurements
// ==================================================

router.post(
  '/me/measurements',
  authenticate,
  ownMeasurementValidation,
  addOwnMeasurementController
);

router.get(
  '/me/measurements',
  authenticate,
  getOwnMeasurementsController
);

// ==================================================
// OBJETIVOS DEL SOCIO AUTENTICADO
// ==================================================

router.post(
  "/me/goals",
  authenticate,
  ownGoalValidation,
  createOwnGoalController
);

router.get(
  "/me/goals",
  authenticate,
  getOwnGoalsController
);

router.patch(
  "/me/goals/:id",
  authenticate,
  updateGoalValidation,
  updateOwnGoalController
);

router.delete(
  "/me/goals/:id",
  authenticate,
  deleteOwnGoalController
);

// ==================================================
// MEDICIONES ADMINISTRATIVAS
// ==================================================

router.post(
  '/:clientId/measurements',
  authenticate,
  authorize('admin', 'receptionist'),
  requireClientAccess,
  measurementValidation,
  addMeasurementController
);

router.get(
  '/:clientId/measurements',
  authenticate,
  authorize('admin', 'receptionist'),
  requireClientAccess,
  getClientMeasurementsController
);

router.get(
  '/:clientId/measurements/latest',
  authenticate,
  authorize('admin', 'receptionist'),
  requireClientAccess,
  getLatestMeasurementController
);

// ==================================================
// OBJETIVOS DE CLIENTES
// ==================================================

router.post(
  '/:clientId/goals',
  authenticate,
  authorize('admin', 'receptionist'),
  requireClientAccess,
  goalValidation,
  createGoalController
);

router.get(
  '/:clientId/goals',
  authenticate,
  authorize('admin', 'receptionist'),
  requireClientAccess,
  getClientGoalsController
);

// ==================================================
// DOCUMENTOS DE CLIENTES
// ==================================================

router.post(
  '/:clientId/documents',
  authenticate,
  authorize('admin', 'receptionist'),
  requireClientAccess,
  documentValidation,
  addDocumentController
);

router.get(
  '/:clientId/documents',
  authenticate,
  authorize('admin', 'receptionist'),
  requireClientAccess,
  getClientDocumentsController
);

// ==================================================
// OBJETIVOS POR ID
// ==================================================

router.patch(
  '/goals/:id',
  authenticate,
  authorize('admin', 'receptionist'),
  updateGoalValidation,
  updateGoalController
);

router.delete(
  '/goals/:id',
  authenticate,
  authorize('admin', 'receptionist'),
  deleteGoalController
);

// ==================================================
// DOCUMENTOS POR ID
// ==================================================

router.delete(
  '/documents/:id',
  authenticate,
  authorize('admin', 'receptionist'),
  deleteDocumentController
);

// ==================================================
// RUTAS GENÉRICAS DEL CLIENTE
// Deben permanecer al final
// ==================================================

router.get(
  '/:id',
  authenticate,
  authorize('admin', 'receptionist'),
  requireClientAccess,
  getClientController
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'receptionist'),
  requireClientAccess,
  updateClientValidation,
  updateClientController
);

if (process.env.NODE_ENV !== 'production') {
  router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    requireClientAccess,
    deleteClientController
  );
}

export default router;
