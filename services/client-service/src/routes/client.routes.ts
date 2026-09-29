import { Router } from 'express';
import {
  createClientController,
  getClientController,
  getClientByDniController,
  getClientByUserIdController,
  updateClientController,
  deleteClientController,
  listClientsController,
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
  measurementValidation,
  goalValidation,
  updateGoalValidation,
  documentValidation,
} from '../controllers/client.controller.js';
import { authenticate, authorize, requireClientAccess, requireUserSelf } from '../middleware/auth.middleware.js';

const router: Router = Router();

// Rutas específicas antes que genéricas
router.post('/', authenticate, authorize('admin', 'receptionist', 'trainer'), createClientValidation, createClientController);
router.get('/', authenticate, authorize('admin', 'receptionist', 'trainer'), listClientsController);
router.get('/dni/:dni', authenticate, authorize('admin', 'receptionist', 'trainer'), getClientByDniController);
router.get('/user/:userId', authenticate, requireUserSelf, getClientByUserIdController);

// Rutas anidadas de cliente (específicas) antes que /:id genérico
router.post('/:clientId/measurements', authenticate, authorize('admin', 'receptionist', 'trainer'), requireClientAccess, measurementValidation, addMeasurementController);
router.get('/:clientId/measurements', authenticate, authorize('admin', 'receptionist', 'trainer'), requireClientAccess, getClientMeasurementsController);
router.get('/:clientId/measurements/latest', authenticate, authorize('admin', 'receptionist', 'trainer'), requireClientAccess, getLatestMeasurementController);

router.post('/:clientId/goals', authenticate, authorize('admin', 'receptionist', 'trainer'), requireClientAccess, goalValidation, createGoalController);
router.get('/:clientId/goals', authenticate, authorize('admin', 'receptionist', 'trainer'), requireClientAccess, getClientGoalsController);

router.post('/:clientId/documents', authenticate, authorize('admin', 'receptionist'), requireClientAccess, documentValidation, addDocumentController);
router.get('/:clientId/documents', authenticate, authorize('admin', 'receptionist', 'trainer'), requireClientAccess, getClientDocumentsController);

// Rutas genéricas de cliente AL FINAL
router.get('/:id', authenticate, authorize('admin', 'receptionist', 'trainer'), requireClientAccess, getClientController);
router.patch('/:id', authenticate, authorize('admin', 'receptionist'), requireClientAccess, updateClientValidation, updateClientController);
router.delete('/:id', authenticate, authorize('admin'), requireClientAccess, deleteClientController);

// Rutas de goals y documents por ID (no anidadas a clientId)
router.patch('/goals/:id', authenticate, authorize('admin', 'receptionist', 'trainer'), updateGoalValidation, updateGoalController);
router.delete('/goals/:id', authenticate, authorize('admin', 'receptionist', 'trainer'), deleteGoalController);
router.delete('/documents/:id', authenticate, authorize('admin', 'receptionist'), deleteDocumentController);

export default router;