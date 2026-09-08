import { Router } from 'express';
import { accountController } from '../controllers/accountController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import {
  CreateAccountInputSchema,
  UpdateAccountInputSchema,
  ToggleAccountStatusSchema,
} from '@finance/shared-types';

export const accountsRouter: Router = Router();

// All accounts routes require authentication
accountsRouter.use(authenticate);

// GET /api/v1/accounts - List all accounts with summary aggregate
accountsRouter.get('/', (req, res, next) => {
  accountController.listAccounts(req, res, next);
});

// POST /api/v1/accounts - Create a new account
accountsRouter.post('/', validateBody(CreateAccountInputSchema), (req, res, next) => {
  accountController.createAccount(req, res, next);
});

// GET /api/v1/accounts/:id - Get account detail with recent transactions
accountsRouter.get('/:id', (req, res, next) => {
  accountController.getAccount(req, res, next);
});

// PUT /api/v1/accounts/:id - Update account metadata
accountsRouter.put('/:id', validateBody(UpdateAccountInputSchema), (req, res, next) => {
  accountController.updateAccount(req, res, next);
});

// PATCH /api/v1/accounts/:id/status - Toggle or set account status (ACTIVE/INACTIVE)
accountsRouter.patch('/:id/status', validateBody(ToggleAccountStatusSchema), (req, res, next) => {
  accountController.toggleAccountStatus(req, res, next);
});

export default accountsRouter;
