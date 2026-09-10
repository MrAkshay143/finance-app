import { Router } from 'express';
import { merchantController } from '../controllers/merchantController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { CreateMerchantInputSchema, UpdateMerchantInputSchema } from '@finance/shared-types';

export const merchantsRouter: Router = Router();

// All merchants routes require authentication
merchantsRouter.use(authenticate);

// GET /api/v1/merchants - List merchants with transaction count and total spent
merchantsRouter.get('/', (req, res, next) => {
  merchantController.listMerchants(req, res, next);
});

// POST /api/v1/merchants - Create a merchant
merchantsRouter.post('/', validateBody(CreateMerchantInputSchema), (req, res, next) => {
  merchantController.createMerchant(req, res, next);
});

// GET /api/v1/merchants/:id - Get single merchant
merchantsRouter.get('/:id', (req, res, next) => {
  merchantController.getMerchant(req, res, next);
});

// PUT /api/v1/merchants/:id - Update merchant
merchantsRouter.put('/:id', validateBody(UpdateMerchantInputSchema), (req, res, next) => {
  merchantController.updateMerchant(req, res, next);
});

// PATCH /api/v1/merchants/:id - Update merchant (alias)
merchantsRouter.patch('/:id', validateBody(UpdateMerchantInputSchema), (req, res, next) => {
  merchantController.updateMerchant(req, res, next);
});

// DELETE /api/v1/merchants/:id - Delete merchant (only if 0 transactions)
merchantsRouter.delete('/:id', (req, res, next) => {
  merchantController.deleteMerchant(req, res, next);
});

export default merchantsRouter;
