import { Router } from 'express';
import { productController } from './product.controller.js';
import { requireAuth, requireRole } from '../auth/middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin routes
router.post('/', requireAuth, requireRole(['ADMIN']), productController.createProduct);
router.put('/:id', requireAuth, requireRole(['ADMIN']), productController.updateProduct);
router.delete('/:id', requireAuth, requireRole(['ADMIN']), productController.deleteProduct);

export const productRoutes: Router = router;
