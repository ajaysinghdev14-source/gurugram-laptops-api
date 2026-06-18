import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { requireAuth, requireRole } from '../auth/middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', categoryController.getAllCategories);

// Admin routes
router.post('/', requireAuth, requireRole(['ADMIN']), categoryController.createCategory);
router.delete('/:id', requireAuth, requireRole(['ADMIN']), categoryController.deleteCategory);

export const categoryRoutes: Router = router;
