import { Router } from 'express';
import { addressController } from './address.controller.js';
import { requireAuth } from '../auth/middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, addressController.getAddresses);
router.post('/', requireAuth, addressController.createAddress);
router.put('/:id', requireAuth, addressController.updateAddress);
router.delete('/:id', requireAuth, addressController.deleteAddress);
router.patch('/:id/default', requireAuth, addressController.setDefault);

export const addressRoutes: import('express').Router = router;
