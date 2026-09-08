import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService.js';
import { famService } from '../services/famService.js';

export class DashboardController {
  async getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await dashboardService.getDashboardSummary(userId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getFamScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const data = await famService.getFamScore(userId, { month, year });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;
