import { Router } from 'express';
import { aiAnalysisController } from '../controllers/aiAnalysisController.js';
import { authenticate } from '../middleware/authenticate.js';

export const aiAnalysisRouter: Router = Router();

aiAnalysisRouter.use(authenticate);

// GET /api/v1/ai-analysis?month=YYYY-MM
aiAnalysisRouter.get('/', (req, res, next) => {
  aiAnalysisController.getAiAnalysis(req, res, next);
});

export default aiAnalysisRouter;
