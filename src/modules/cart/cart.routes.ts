import { Router } from 'express';
import { cartController } from './cart.controller.js';
import { requireAuth } from '../auth/middlewares/auth.middleware.js';

const router = Router();

// All cart routes require authentication
router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:id', cartController.updateQuantity);
router.delete('/items/:id', cartController.removeItem);
router.post('/sync', cartController.syncCart);

export const cartRoutes: Router = router;
