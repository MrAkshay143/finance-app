import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService.js';

export class AiAnalysisController {
  async getAiAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { month } = req.query;
      const data = await aiService.getAiAnalysis(userId, month as string | undefined);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiAnalysisController = new AiAnalysisController();
export default aiAnalysisController;
