import { Request, Response, NextFunction } from 'express';
import { investmentService } from '../services/investmentService.js';

export class InvestmentsController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await investmentService.getInvestmentsOverview(userId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const investmentsController = new InvestmentsController();
export default investmentsController;
