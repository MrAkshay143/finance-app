import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  SignupInputSchema,
  LoginInputSchema,
  ChangePasswordSchema,
} from '@finance/shared-types';

export const authRouter: Router = Router();

// Tight rate limiters for sensitive auth endpoints (SEC-11)
const isTestEnv = process.env.NODE_ENV === 'test';

const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: isTestEnv ? 1000 : 10,
  message: 'Too many login attempts. Please wait a minute before trying again.',
});

const signupRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: isTestEnv ? 1000 : 5,
  message: 'Too many signup attempts. Please wait a minute before trying again.',
});

const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: isTestEnv ? 1000 : 5,
  message: 'Too many password reset requests. Please wait a minute before trying again.',
});

// Public auth endpoints
authRouter.post('/signup', signupRateLimiter, validateBody(SignupInputSchema), (req, res, next) => {
  authController.signup(req, res, next);
});

authRouter.post('/login', loginRateLimiter, validateBody(LoginInputSchema), (req, res, next) => {
  authController.login(req, res, next);
});

authRouter.post('/refresh', (req, res, next) => {
  authController.refresh(req, res, next);
});

// Forgot Password recovery flow (public)
authRouter.post('/forgot-password/initiate', forgotPasswordRateLimiter, (req, res, next) => {
  authController.initiateForgotPassword(req, res, next);
});

authRouter.post('/forgot-password/verify', forgotPasswordRateLimiter, (req, res, next) => {
  authController.verifyForgotPassword(req, res, next);
});

authRouter.post('/reset-password', forgotPasswordRateLimiter, (req, res, next) => {
  authController.resetPassword(req, res, next);
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
