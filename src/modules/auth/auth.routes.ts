import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import { loginSchema, refreshTokenSchema, registerSchema } from './dto/auth.dto.js';
import { requireAuth } from './middlewares/auth.middleware.js';
import { UserRepository } from './user.repository.js';

const router = Router();

router.post(
  '/register',
  validateRequest(registerSchema),
  AuthController.createUserWithEmailAndPassword,
);

router.post('/login', validateRequest(loginSchema), AuthController.loginWithEmailAndPassword);

router.get('/me', requireAuth, async (req, res) => {
  const userId = res.locals.user.id;
  const user = await UserRepository.findUserById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({
    success: true,
    message: 'you have accessed the VIP area',
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status
  });
});

router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', requireAuth, AuthController.logout);

router.post('/verify-email', AuthController.verifyEmail);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export const authRoutes: Router = router;
