import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { uploadController } from './upload.controller.js';
import { upload } from './upload.middleware.js';
import { requireAuth, requireRole } from '../auth/middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/upload — Admin only, single image upload
router.post(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  upload.single('image'),
  uploadController.uploadImage,
);

export const uploadRoutes: RouterType = router;
