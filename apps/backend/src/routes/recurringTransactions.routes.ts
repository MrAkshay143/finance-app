import { Router } from 'express';
import { recurringController } from '../controllers/recurringController.js';
import { authenticate } from '../middleware/authenticate.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

export const recurringTransactionsRouter: Router = Router();

recurringTransactionsRouter.use(authenticate);

// GET /api/v1/recurring-transactions - List recurring transactions
recurringTransactionsRouter.get('/', (req, res, next) => {
  recurringController.list(req, res, next);
});

// POST /api/v1/recurring-transactions - Create recurring transaction
recurringTransactionsRouter.post('/', idempotencyMiddleware, (req, res, next) => {
  recurringController.create(req, res, next);
});

// POST /api/v1/recurring-transactions/materialize - Materialize due transactions
recurringTransactionsRouter.post('/materialize', idempotencyMiddleware, (req, res, next) => {
  recurringController.materialize(req, res, next);
});

// GET /api/v1/recurring-transactions/:id - Get recurring transaction
recurringTransactionsRouter.get('/:id', (req, res, next) => {
  recurringController.getById(req, res, next);
});

// PUT /api/v1/recurring-transactions/:id - Update recurring transaction
recurringTransactionsRouter.put('/:id', idempotencyMiddleware, (req, res, next) => {
  recurringController.update(req, res, next);
});

// PATCH /api/v1/recurring-transactions/:id - Update recurring transaction (alias)
recurringTransactionsRouter.patch('/:id', idempotencyMiddleware, (req, res, next) => {
  recurringController.update(req, res, next);
});

// DELETE /api/v1/recurring-transactions/:id - Soft-delete recurring transaction
recurringTransactionsRouter.delete('/:id', idempotencyMiddleware, (req, res, next) => {
  recurringController.delete(req, res, next);
});

// PATCH /api/v1/recurring-transactions/:id/status - Toggle/patch status
recurringTransactionsRouter.patch('/:id/status', idempotencyMiddleware, (req, res, next) => {
  recurringController.toggleStatus(req, res, next);
});

export default recurringTransactionsRouter;
