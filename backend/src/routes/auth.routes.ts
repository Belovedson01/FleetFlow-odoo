import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Role } from '@prisma/client';
import {
  createPrivilegedUserController,
  forgotPasswordController,
  login,
  logoutController,
  me,
  refreshTokenController,
  register,
  resendVerificationController,
  verifyEmailController,
  resetPasswordController
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  createPrivilegedUserSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
  resetPasswordSchema
} from '../validators/auth.validator';

const router = Router();
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in a minute.' }
});

router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), forgotPasswordController);
router.post('/resend-verification', authRateLimiter, validateBody(resendVerificationSchema), resendVerificationController);
router.post('/verify-email', authRateLimiter, validateBody(verifyEmailSchema), verifyEmailController);
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), resetPasswordController);
router.post('/refresh', refreshTokenController);
router.post('/logout', logoutController);
router.get('/me', authenticate, me);
router.post(
  '/admin/users',
  authenticate,
  requireRole([Role.MANAGER]),
  validateBody(createPrivilegedUserSchema),
  createPrivilegedUserController
);

export default router;
