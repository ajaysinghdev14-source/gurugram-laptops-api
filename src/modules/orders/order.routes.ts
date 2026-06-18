import { Router } from 'express';
import { orderController } from './order.controller.js';
import { requireAuth, requireRole } from '../auth/middlewares/auth.middleware.js';

const router = Router();

// User routes
router.post('/checkout', requireAuth, orderController.checkout);
router.get('/my-orders', requireAuth, orderController.getMyOrders);

// Admin routes
router.get('/', requireAuth, requireRole(['ADMIN']), orderController.getAllOrders);
router.patch('/:id/status', requireAuth, requireRole(['ADMIN']), orderController.updateOrderStatus);

export const orderRoutes: import('express').Router = router;
