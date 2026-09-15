import { Router } from 'express';
import { accountController } from '../controllers/accountController.js';
import { authenticate } from '../middleware/authenticate.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';
import {
  CreateAccountInputSchema,
  UpdateAccountInputSchema,
  ToggleAccountStatusSchema,
} from '@finance/shared-types';

export const accountsRouter: Router = Router();

accountsRouter.use(authenticate);

accountsRouter.get('/', (req, res, next) => {
  accountController.listAccounts(req, res, next);
});

accountsRouter.post('/', validateBody(CreateAccountInputSchema), idempotencyMiddleware, (req, res, next) => {
  accountController.createAccount(req, res, next);
});

accountsRouter.get('/:id', (req, res, next) => {
  accountController.getAccount(req, res, next);
});

accountsRouter.put('/:id', validateBody(UpdateAccountInputSchema), idempotencyMiddleware, (req, res, next) => {
  accountController.updateAccount(req, res, next);
});

accountsRouter.patch('/:id', validateBody(UpdateAccountInputSchema), idempotencyMiddleware, (req, res, next) => {
  accountController.updateAccount(req, res, next);
});

accountsRouter.delete('/:id', idempotencyMiddleware, (req, res, next) => {
  accountController.deleteAccount(req, res, next);
});

accountsRouter.patch('/:id/status', validateBody(ToggleAccountStatusSchema), idempotencyMiddleware, (req, res, next) => {
  accountController.toggleAccountStatus(req, res, next);
});

export default accountsRouter;
