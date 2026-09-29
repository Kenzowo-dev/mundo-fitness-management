import { Router } from 'express';
import {
  createPlanController,
  getPlanController,
  listPlansController,
  updatePlanController,
  deletePlanController,
  createMembershipController,
  getMembershipController,
  getClientMembershipsController,
  updateMembershipController,
  cancelMembershipController,
  renewMembershipController,
  checkInController,
  checkOutController,
  getClientVisitsController,
  createFreezeController,
  getMembershipFreezesController,
  getExpiringMembershipsController,
  createPlanValidation,
  updatePlanValidation,
  createMembershipValidation,
  updateMembershipValidation,
  visitValidation,
  freezeValidation,
} from '../controllers/membership.controller.js';
import { authenticate, authorize, requireClientAccess, requireMembershipAccess } from '../middleware/auth.middleware.js';

const router: Router = Router();

// Planes - rutas específicas primero
router.get('/plans', authenticate, listPlansController);
router.get('/plans/:id', authenticate, getPlanController);
router.post('/plans', authenticate, authorize('admin'), createPlanValidation, createPlanController);
router.patch('/plans/:id', authenticate, authorize('admin'), updatePlanValidation, updatePlanController);
router.delete('/plans/:id', authenticate, authorize('admin'), deletePlanController);

// Membresías - rutas específicas antes que genéricas
router.get('/expiring', authenticate, authorize('admin', 'receptionist'), getExpiringMembershipsController);
router.get('/client/:clientId', authenticate, requireClientAccess, getClientMembershipsController);
router.post('/', authenticate, authorize('admin', 'receptionist'), createMembershipValidation, createMembershipController);
router.get('/:id', authenticate, authorize('admin', 'receptionist', 'trainer'), requireMembershipAccess, getMembershipController);
router.patch('/:id', authenticate, authorize('admin', 'receptionist'), requireMembershipAccess, updateMembershipValidation, updateMembershipController);
router.post('/:id/cancel', authenticate, authorize('admin', 'receptionist'), requireMembershipAccess, cancelMembershipController);
router.post('/:id/renew', authenticate, authorize('admin', 'receptionist'), requireMembershipAccess, renewMembershipController);

// Visitas
router.post('/visits/check-in', authenticate, authorize('admin', 'receptionist', 'trainer'), visitValidation, checkInController);
router.post('/visits/:visitId/check-out', authenticate, authorize('admin', 'receptionist', 'trainer'), checkOutController);
router.get('/visits/client/:clientId', authenticate, authorize('admin', 'receptionist', 'trainer'), requireClientAccess, getClientVisitsController);

// Congelamientos
router.post('/freezes', authenticate, authorize('admin', 'receptionist'), freezeValidation, createFreezeController);
router.get('/freezes/:membershipId', authenticate, authorize('admin', 'receptionist', 'trainer'), requireMembershipAccess, getMembershipFreezesController);

export default router;