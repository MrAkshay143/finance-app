import { Router } from 'express';
import { budgetController } from '../controllers/budgetController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { CreateBudgetInputSchema, UpdateBudgetInputSchema } from '@finance/shared-types';

export const budgetsRouter: Router = Router();

// All budgets routes require authentication
budgetsRouter.use(authenticate);

// GET /api/v1/budgets - List budgets with live spent calculations
budgetsRouter.get('/', (req, res, next) => {
  budgetController.listBudgets(req, res, next);
});

// POST /api/v1/budgets - Create a budget
budgetsRouter.post('/', validateBody(CreateBudgetInputSchema), (req, res, next) => {
  budgetController.createBudget(req, res, next);
});

// GET /api/v1/budgets/:id - Get single budget
budgetsRouter.get('/:id', (req, res, next) => {
  budgetController.getBudget(req, res, next);
});

// PUT /api/v1/budgets/:id - Update budget
budgetsRouter.put('/:id', validateBody(UpdateBudgetInputSchema), (req, res, next) => {
  budgetController.updateBudget(req, res, next);
});

// PATCH /api/v1/budgets/:id - Update budget (alias)
budgetsRouter.patch('/:id', validateBody(UpdateBudgetInputSchema), (req, res, next) => {
  budgetController.updateBudget(req, res, next);
});

// DELETE /api/v1/budgets/:id - Soft-delete budget
budgetsRouter.delete('/:id', (req, res, next) => {
  budgetController.deleteBudget(req, res, next);
});

export default budgetsRouter;
