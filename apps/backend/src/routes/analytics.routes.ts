import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authenticate.js';

export const analyticsRouter: Router = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get('/', (req, res, next) => {
  analyticsController.getAnalytics(req, res, next);
});

export default analyticsRouter;
