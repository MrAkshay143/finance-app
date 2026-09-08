import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/reportService.js';
import { ValidationError } from '../utils/errors.js';

export class ReportsController {
  async getMonthlyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const month = req.query.month as string;

      if (!month) {
        throw new ValidationError('Month query parameter is required (YYYY-MM)');
      }

      const report = await reportService.getMonthlyReport(userId, month);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { month, format } = req.body;

      if (!month) {
        throw new ValidationError('Month is required (YYYY-MM)');
      }

      const exportResult = await reportService.exportReport(userId, month, format || 'json');

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.status(200).send(exportResult.data);
        return;
      }

      res.status(200).json({
        success: true,
        data: exportResult,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAnnualReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();

      const report = await reportService.getAnnualReport(userId, year);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCustomRangeReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        throw new ValidationError('startDate and endDate query parameters are required (YYYY-MM-DD)');
      }

      const report = await reportService.getCustomRangeReport(userId, startDate, endDate);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
export default reportsController;
