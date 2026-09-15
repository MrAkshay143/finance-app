import { Router } from 'express';
import { budgetController } from '../controllers/budgetController.js';
import { authenticate } from '../middleware/authenticate.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';
import { CreateBudgetInputSchema, UpdateBudgetInputSchema } from '@finance/shared-types';

export const budgetsRouter: Router = Router();

budgetsRouter.use(authenticate);

budgetsRouter.get('/', (req, res, next) => {
  budgetController.listBudgets(req, res, next);
});

budgetsRouter.post('/', validateBody(CreateBudgetInputSchema), idempotencyMiddleware, (req, res, next) => {
  budgetController.createBudget(req, res, next);
});

budgetsRouter.get('/:id', (req, res, next) => {
  budgetController.getBudget(req, res, next);
});

budgetsRouter.put('/:id', validateBody(UpdateBudgetInputSchema), idempotencyMiddleware, (req, res, next) => {
  budgetController.updateBudget(req, res, next);
});

budgetsRouter.patch('/:id', validateBody(UpdateBudgetInputSchema), idempotencyMiddleware, (req, res, next) => {
  budgetController.updateBudget(req, res, next);
});

budgetsRouter.delete('/:id', idempotencyMiddleware, (req, res, next) => {
  budgetController.deleteBudget(req, res, next);
});

export default budgetsRouter;
