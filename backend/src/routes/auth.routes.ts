import { Role } from '@prisma/client';
import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/register', authenticate, authorize(Role.MANAGER), validateBody(registerSchema), register);
router.get('/me', authenticate, me);

export default router;
