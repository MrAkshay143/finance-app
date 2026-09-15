import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';

export const dashboardRouter: Router = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/', (req, res, next) => {
  dashboardController.getDashboardSummary(req, res, next);
});

dashboardRouter.get('/fam', (req, res, next) => {
  dashboardController.getFamScore(req, res, next);
});

export default dashboardRouter;
