import { Request, Response, NextFunction } from 'express';
import { recurringService } from '../services/recurringService.js';

export class RecurringController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, type } = req.query;
      const data = await recurringService.listRecurring(userId, {
        status: status as any,
        type: type as any,
      });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = await recurringService.getRecurring(userId, id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await recurringService.createRecurring(userId, req.body);
      res.status(201).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = await recurringService.updateRecurring(userId, id, req.body);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = await recurringService.deleteRecurring(userId, id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { status } = req.body || {};
      const data = await recurringService.toggleStatus(userId, id, status);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async materialize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { asOfDate } = req.body || {};
      const parsedDate = asOfDate ? new Date(asOfDate) : new Date();
      const result = await recurringService.materializeDueTransactions(parsedDate);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const recurringController = new RecurringController();
export default recurringController;
