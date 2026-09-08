import { Router } from 'express';
import { reportsController } from '../controllers/reportsController.js';
import { authenticate } from '../middleware/authenticate.js';

export const reportsRouter: Router = Router();

reportsRouter.use(authenticate);

// GET /api/v1/reports
reportsRouter.get('/', (req, res, next) => {
  reportsController.getMonthlyReport(req, res, next);
});

// GET /api/v1/reports/annual
reportsRouter.get('/annual', (req, res, next) => {
  reportsController.getAnnualReport(req, res, next);
});

// GET /api/v1/reports/custom
reportsRouter.get('/custom', (req, res, next) => {
  reportsController.getCustomRangeReport(req, res, next);
});

// POST /api/v1/reports/export
reportsRouter.post('/export', (req, res, next) => {
  reportsController.exportReport(req, res, next);
});

export default reportsRouter;
