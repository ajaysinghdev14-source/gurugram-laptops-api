import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAuth } from '../auth/middlewares/auth.middleware.js';
import { requireAdmin } from '../../common/middlewares/admin.middleware.js';

const router = Router();

// Protect all admin routes with both middlewares
router.use(requireAuth);
router.use(requireAdmin);

router.get('/users', AdminController.getAllUsers);
router.patch('/users/:id/role', AdminController.updateUserRole);
router.patch('/users/:id/status', AdminController.updateUserStatus);

export const adminRoutes: Router = router;
