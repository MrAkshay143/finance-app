import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService.js';

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { month, period, startDate, endDate } = req.query;
      const data = await analyticsService.getAnalytics(userId, {
        month: month as string | undefined,
        period: period as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
export default analyticsController;
