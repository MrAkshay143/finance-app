import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import {
  SignupInputSchema,
  LoginInputSchema,
  ChangePasswordSchema,
} from '@finance/shared-types';

export const authRouter: Router = Router();

// Public auth endpoints
authRouter.post('/signup', validateBody(SignupInputSchema), (req, res, next) => {
  authController.signup(req, res, next);
});

authRouter.post('/login', validateBody(LoginInputSchema), (req, res, next) => {
  authController.login(req, res, next);
});

authRouter.post('/refresh', (req, res, next) => {
  authController.refresh(req, res, next);
});

// Authenticated auth endpoints
authRouter.post('/logout', authenticate, (req, res, next) => {
  authController.logout(req, res, next);
});

authRouter.post(
  '/change-password',
  authenticate,
  validateBody(ChangePasswordSchema),
  (req, res, next) => {
    authController.changePassword(req, res, next);
  }
);

authRouter.get('/me', authenticate, (req, res, next) => {
  authController.me(req, res, next);
});

authRouter.get('/sessions', authenticate, (req, res, next) => {
  authController.getSessions(req, res, next);
});

authRouter.post('/sessions/revoke-others', authenticate, (req, res, next) => {
  authController.revokeOtherSessions(req, res, next);
});

export default authRouter;
