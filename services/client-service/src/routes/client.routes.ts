import { Router } from 'express';
import {
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
} from '../controllers/client.controller.js';
import { authenticate, authorize, requireClientAccess, requireUserSelf } from '../middleware/auth.middleware.js';

const router: Router = Router();

// Rutas específicas antes que genéricas
router.post('/', authenticate, authorize('admin', 'receptionist'), createClientValidation, createClientController);
router.get('/', authenticate, authorize('admin', 'receptionist'), listClientsController);
router.get('/stats', authenticate, authorize('admin', 'receptionist'), getClientStatsController);
router.get('/reports', authenticate, authorize('admin', 'receptionist'), getClientReportsController);
router.get('/dni/:dni', authenticate, authorize('admin', 'receptionist'), getClientByDniController);
router.get('/user/:userId', authenticate, requireUserSelf, getClientByUserIdController);
router.patch('/user/:userId', authenticate, requireUserSelf, updateOwnClientValidation, updateOwnClientController);

// Rutas anidadas de cliente (específicas) antes que /:id genérico
router.post('/:clientId/measurements', authenticate, authorize('admin', 'receptionist'), requireClientAccess, measurementValidation, addMeasurementController);
router.get('/:clientId/measurements', authenticate, authorize('admin', 'receptionist'), requireClientAccess, getClientMeasurementsController);
router.get('/:clientId/measurements/latest', authenticate, authorize('admin', 'receptionist'), requireClientAccess, getLatestMeasurementController);

router.post('/:clientId/goals', authenticate, authorize('admin', 'receptionist'), requireClientAccess, goalValidation, createGoalController);
router.get('/:clientId/goals', authenticate, authorize('admin', 'receptionist'), requireClientAccess, getClientGoalsController);

router.post('/:clientId/documents', authenticate, authorize('admin', 'receptionist'), requireClientAccess, documentValidation, addDocumentController);
router.get('/:clientId/documents', authenticate, authorize('admin', 'receptionist'), requireClientAccess, getClientDocumentsController);

// Rutas genéricas de cliente AL FINAL
router.get('/:id', authenticate, authorize('admin', 'receptionist'), requireClientAccess, getClientController);
router.patch('/:id', authenticate, authorize('admin', 'receptionist'), requireClientAccess, updateClientValidation, updateClientController);
router.delete('/:id', authenticate, authorize('admin'), requireClientAccess, deleteClientController);

// Rutas de goals y documents por ID (no anidadas a clientId)
router.patch('/goals/:id', authenticate, authorize('admin', 'receptionist'), updateGoalValidation, updateGoalController);
router.delete('/goals/:id', authenticate, authorize('admin', 'receptionist'), deleteGoalController);
router.delete('/documents/:id', authenticate, authorize('admin', 'receptionist'), deleteDocumentController);

export default router;
