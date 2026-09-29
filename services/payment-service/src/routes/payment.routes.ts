import { Router } from 'express';
import {
  createPaymentController,
  getPaymentController,
  getPaymentByTransactionIdController,
  updatePaymentController,
  listPaymentsController,
  createInvoiceController,
  getInvoiceController,
  getInvoiceByNumberController,
  listInvoicesController,
  markInvoicePaidController,
  cancelInvoiceController,
  createPaymentMethodController,
  getClientPaymentMethodsController,
  setDefaultPaymentMethodController,
  deactivatePaymentMethodController,
  createRefundController,
  processRefundController,
  getClientPaymentsSummaryController,
  createPaymentValidation,
  updatePaymentValidation,
  createInvoiceValidation,
  paymentMethodValidation,
  refundValidation,
} from '../controllers/payment.controller.js';
import { authenticate, authorize, requireClientAccess, requirePaymentAccess, requireInvoiceAccess } from '../middleware/auth.middleware.js';

const router: Router = Router();

// Rutas específicas antes que genéricas
router.post('/', authenticate, authorize('admin', 'receptionist'), requireClientAccess, createPaymentValidation, createPaymentController);
router.get('/', authenticate, authorize('admin', 'receptionist'), listPaymentsController);
router.get('/transaction/:transactionId', authenticate, authorize('admin', 'receptionist'), getPaymentByTransactionIdController);
router.get('/summary/:clientId', authenticate, requireClientAccess, getClientPaymentsSummaryController);

// Facturas - específicas
router.post('/invoices', authenticate, authorize('admin', 'receptionist'), requireClientAccess, createInvoiceValidation, createInvoiceController);
router.get('/invoices', authenticate, authorize('admin', 'receptionist'), listInvoicesController);
router.get('/invoices/number/:invoiceNumber', authenticate, authorize('admin', 'receptionist'), getInvoiceByNumberController);
router.get('/invoices/:id', authenticate, authorize('admin', 'receptionist'), requireInvoiceAccess, getInvoiceController);
router.post('/invoices/:id/pay', authenticate, authorize('admin', 'receptionist'), requireInvoiceAccess, markInvoicePaidController);
router.post('/invoices/:id/cancel', authenticate, authorize('admin', 'receptionist'), requireInvoiceAccess, cancelInvoiceController);

// Métodos de pago
router.post('/methods', authenticate, paymentMethodValidation, createPaymentMethodController);
router.get('/methods/:clientId', authenticate, requireClientAccess, getClientPaymentMethodsController);
router.post('/methods/:clientId/:methodId/default', authenticate, requireClientAccess, setDefaultPaymentMethodController);
router.delete('/methods/:clientId/:methodId', authenticate, requireClientAccess, deactivatePaymentMethodController);

// Reembolsos
router.post('/refunds', authenticate, authorize('admin', 'receptionist'), refundValidation, createRefundController);
router.post('/refunds/:refundId/process', authenticate, authorize('admin'), processRefundController);

// Genérica al final
router.get('/:id', authenticate, authorize('admin', 'receptionist'), requirePaymentAccess, getPaymentController);
router.patch('/:id', authenticate, authorize('admin', 'receptionist'), requirePaymentAccess, updatePaymentValidation, updatePaymentController);

export default router;