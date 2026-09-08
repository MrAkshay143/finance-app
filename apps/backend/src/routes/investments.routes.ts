import { Router } from 'express';
import { investmentsController } from '../controllers/investmentsController.js';
import { authenticate } from '../middleware/authenticate.js';

export const investmentsRouter: Router = Router();

investmentsRouter.use(authenticate);

// GET /api/v1/investments - Get investments overview
investmentsRouter.get('/', (req, res, next) => {
  investmentsController.getOverview(req, res, next);
});

// GET /api/v1/investments/summary - Get investments summary (alias)
investmentsRouter.get('/summary', (req, res, next) => {
  investmentsController.getOverview(req, res, next);
});

export default investmentsRouter;
