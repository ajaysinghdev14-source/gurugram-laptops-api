import { Router } from 'express';
import { HealthController } from './health.controller.js';

const router = Router();

router.get('/', HealthController.check);

export const healthRoutes: Router = router;
