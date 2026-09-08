import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  CreateTransactionInputSchema,
  UpdateTransactionInputSchema,
  TransactionFilterQuerySchema,
} from '@finance/shared-types';

export const transactionsRouter: Router = Router();

// All transactions routes require authentication
transactionsRouter.use(authenticate);

// GET /api/v1/transactions - List transactions with filters & pagination
transactionsRouter.get('/', validateQuery(TransactionFilterQuerySchema), (req, res, next) => {
  transactionController.listTransactions(req, res, next);
});

// POST /api/v1/transactions - Create a transaction
transactionsRouter.post('/', validateBody(CreateTransactionInputSchema), (req, res, next) => {
  transactionController.createTransaction(req, res, next);
});

// GET /api/v1/transactions/:id - Get single transaction
transactionsRouter.get('/:id', (req, res, next) => {
  transactionController.getTransaction(req, res, next);
});

// PUT /api/v1/transactions/:id - Update transaction
transactionsRouter.put('/:id', validateBody(UpdateTransactionInputSchema), (req, res, next) => {
  transactionController.updateTransaction(req, res, next);
});

// DELETE /api/v1/transactions/:id - Soft-delete transaction
transactionsRouter.delete('/:id', (req, res, next) => {
  transactionController.deleteTransaction(req, res, next);
});

export default transactionsRouter;
