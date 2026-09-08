import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';

export const dashboardRouter: Router = Router();

// All dashboard routes require authentication
dashboardRouter.use(authenticate);

// GET /api/v1/dashboard - Full dashboard summary payload with Redis cache
dashboardRouter.get('/', (req, res, next) => {
  dashboardController.getDashboardSummary(req, res, next);
});

// GET /api/v1/dashboard/fam - FAM score calculation
dashboardRouter.get('/fam', (req, res, next) => {
  dashboardController.getFamScore(req, res, next);
});

export default dashboardRouter;
