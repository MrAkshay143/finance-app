import { Router } from 'express';
import { securityQuestionsController } from '../controllers/securityQuestionsController.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import {
  SecurityQuestionsSetupSchema,
  SecurityQuestionsVerifySchema,
} from '@finance/shared-types';

export const securityQuestionsRouter: Router = Router();

// GET available predefined questions (public/helper)
securityQuestionsRouter.get('/available', (req, res) => {
  securityQuestionsController.getAvailable(req, res);
});

// GET configured security questions for authenticated user (no answers/hashes returned)
securityQuestionsRouter.get('/', authenticate, (req, res, next) => {
  securityQuestionsController.getQuestions(req, res, next);
});

// POST setup security questions (exactly 3 questions required)
securityQuestionsRouter.post(
  '/',
  authenticate,
  validateBody(SecurityQuestionsSetupSchema),
  (req, res, next) => {
    securityQuestionsController.setupQuestions(req, res, next);
  }
);

// Alias: POST /setup
securityQuestionsRouter.post(
  '/setup',
  authenticate,
  validateBody(SecurityQuestionsSetupSchema),
  (req, res, next) => {
    securityQuestionsController.setupQuestions(req, res, next);
  }
);

// POST verify security questions (public or authenticated)
securityQuestionsRouter.post(
  '/verify',
  optionalAuthenticate,
  validateBody(SecurityQuestionsVerifySchema),
  (req, res, next) => {
    securityQuestionsController.verifyQuestions(req, res, next);
  }
);

export default securityQuestionsRouter;
