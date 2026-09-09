import { Router } from 'express';
import { recurringController } from '../controllers/recurringController.js';
import { authenticate } from '../middleware/authenticate.js';

export const recurringTransactionsRouter: Router = Router();

recurringTransactionsRouter.use(authenticate);

// GET /api/v1/recurring-transactions - List recurring transactions
recurringTransactionsRouter.get('/', (req, res, next) => {
  recurringController.list(req, res, next);
});

// POST /api/v1/recurring-transactions - Create recurring transaction
recurringTransactionsRouter.post('/', (req, res, next) => {
  recurringController.create(req, res, next);
});

// NOTE: POST /materialize is intentionally NOT exposed here.
// Materialization of recurring transactions for ALL users is a privileged admin/worker
// operation that must only be triggered by internal BullMQ workers or the admin router (SEC-06).

// GET /api/v1/recurring-transactions/:id - Get recurring transaction
recurringTransactionsRouter.get('/:id', (req, res, next) => {
  recurringController.getById(req, res, next);
});

// PUT /api/v1/recurring-transactions/:id - Update recurring transaction
recurringTransactionsRouter.put('/:id', (req, res, next) => {
  recurringController.update(req, res, next);
});

// DELETE /api/v1/recurring-transactions/:id - Soft-delete recurring transaction
recurringTransactionsRouter.delete('/:id', (req, res, next) => {
  recurringController.delete(req, res, next);
});

// PATCH /api/v1/recurring-transactions/:id/status - Toggle/patch status
recurringTransactionsRouter.patch('/:id/status', (req, res, next) => {
  recurringController.toggleStatus(req, res, next);
});

export default recurringTransactionsRouter;
