import { Router } from 'express';
import { forgotPasswordController, login, me, register } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { forgotPasswordSchema, loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/register', validateBody(registerSchema), register);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPasswordController);
router.get('/me', authenticate, me);

export default router;
