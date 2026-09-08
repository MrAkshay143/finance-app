import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { accountActionsController } from '../controllers/accountActionsController.js';

export const accountActionsRouter: Router = Router();

accountActionsRouter.use(authenticate);

accountActionsRouter.post('/reset-profile', (req, res, next) =>
  accountActionsController.resetProfile(req, res, next)
);
accountActionsRouter.post('/delete-account', (req, res, next) =>
  accountActionsController.deleteAccount(req, res, next)
);

export default accountActionsRouter;
