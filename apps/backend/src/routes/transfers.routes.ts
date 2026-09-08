import { Router } from 'express';
import { transferController } from '../controllers/transferController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { CreateTransferInputSchema } from '@finance/shared-types';

export const transfersRouter: Router = Router();

// All transfers routes require authentication
transfersRouter.use(authenticate);

// GET /api/v1/transfers - List transfers for user
transfersRouter.get('/', (req, res, next) => {
  transferController.listTransfers(req, res, next);
});

// POST /api/v1/transfers - Create an atomic transfer between two accounts
transfersRouter.post('/', validateBody(CreateTransferInputSchema), (req, res, next) => {
  transferController.createTransfer(req, res, next);
});

// GET /api/v1/transfers/:id - Get transfer detail
transfersRouter.get('/:id', (req, res, next) => {
  transferController.getTransfer(req, res, next);
});

// DELETE /api/v1/transfers/:id - Delete transfer and revert account balances
transfersRouter.delete('/:id', (req, res, next) => {
  transferController.deleteTransfer(req, res, next);
});

export default transfersRouter;
