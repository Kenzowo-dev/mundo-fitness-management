import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  changePasswordController,
  requestPasswordResetController,
  resetPasswordController,
  getCurrentUserController,
  updateCurrentUserController,
  getUserController,
  updateUserController,
  deleteUserController,
  listUsersController,
  getRolesController,
  registerValidation,
  loginValidation,
  refreshValidation,
  changePasswordValidation,
  resetPasswordRequestValidation,
  resetPasswordValidation,
  updateSelfValidation,
  updateUserValidation,
} from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.post('/register', registerValidation, registerController);
router.post('/login', loginValidation, loginController);
router.post('/refresh', refreshValidation, refreshController);
router.post('/logout', authenticate, logoutController);
router.post('/change-password', authenticate, changePasswordValidation, changePasswordController);
router.post('/forgot-password', resetPasswordRequestValidation, requestPasswordResetController);
router.post('/reset-password', resetPasswordValidation, resetPasswordController);

router.get('/me', authenticate, getCurrentUserController);
router.patch('/me', authenticate, updateSelfValidation, updateCurrentUserController);

router.get('/users', authenticate, authorize('admin'), listUsersController);
router.get('/users/:id', authenticate, authorize('admin'), getUserController);
router.patch('/users/:id', authenticate, authorize('admin'), updateUserValidation, updateUserController);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUserController);

router.get('/roles', authenticate, authorize('admin'), getRolesController);

export default router;