import { Router } from 'express';
import {
  createTemplateController,
  getTemplateController,
  listTemplatesController,
  updateTemplateController,
  deleteTemplateController,
  executeQueryController,
  generateReportController,
  getGeneratedReportController,
  listGeneratedReportsController,
  createWidgetController,
  listWidgetsController,
  updateWidgetController,
  deleteWidgetController,
  executeWidgetController,
  createDashboardController,
  getUserDashboardsController,
  getDashboardController,
  updateDashboardController,
  deleteDashboardController,
  trackEventController,
  getEventCountsController,
  createTemplateValidation,
  executeQueryValidation,
  generateReportValidation,
  createWidgetValidation,
  createDashboardValidation,
  trackEventValidation,
} from '../controllers/report.controller.js';
import { authenticate, authorize, requireDashboardAccess, requireUserSelf } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.post('/templates', authenticate, authorize('admin'), createTemplateValidation, createTemplateController);
router.get('/templates', authenticate, authorize('admin', 'trainer', 'receptionist'), listTemplatesController);
router.get('/templates/:id', authenticate, authorize('admin', 'trainer', 'receptionist'), getTemplateController);
router.patch('/templates/:id', authenticate, authorize('admin'), updateTemplateController);
router.delete('/templates/:id', authenticate, authorize('admin'), deleteTemplateController);

router.post('/query', authenticate, authorize('admin'), executeQueryValidation, executeQueryController);
router.post('/generate', authenticate, authorize('admin', 'trainer', 'receptionist'), generateReportValidation, generateReportController);
router.get('/generated', authenticate, authorize('admin', 'trainer', 'receptionist'), listGeneratedReportsController);
router.get('/generated/:id', authenticate, authorize('admin', 'trainer', 'receptionist'), getGeneratedReportController);

router.post('/widgets', authenticate, authorize('admin'), createWidgetValidation, createWidgetController);
router.get('/widgets', authenticate, authorize('admin', 'trainer', 'receptionist'), listWidgetsController);
router.get('/widgets/:widgetId/execute', authenticate, authorize('admin', 'trainer', 'receptionist'), executeWidgetController);
router.patch('/widgets/:id', authenticate, authorize('admin'), updateWidgetController);
router.delete('/widgets/:id', authenticate, authorize('admin'), deleteWidgetController);

router.post('/dashboards', authenticate, createDashboardValidation, createDashboardController);
router.get('/dashboards/user/:userId', authenticate, requireUserSelf, getUserDashboardsController);
router.get('/dashboards/:id', authenticate, requireDashboardAccess, getDashboardController);
router.patch('/dashboards/:id', authenticate, requireDashboardAccess, updateDashboardController);
router.delete('/dashboards/:id', authenticate, requireDashboardAccess, deleteDashboardController);

router.post('/events', authenticate, trackEventValidation, trackEventController);
router.get('/events/counts', authenticate, authorize('admin', 'trainer', 'receptionist'), getEventCountsController);

export default router;