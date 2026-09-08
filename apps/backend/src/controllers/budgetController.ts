import { Request, Response, NextFunction } from 'express';
import { budgetService } from '../services/budgetService.js';

export class BudgetController {
  async listBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const period = req.query.period as string | undefined;
      const budgets = await budgetService.listBudgets(userId, period);
      res.status(200).json({
        success: true,
        data: budgets,
      });
    } catch (err) {
      next(err);
    }
  }

  async createBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const budget = await budgetService.createBudget(userId, req.body);
      res.status(201).json({
        success: true,
        data: budget,
      });
    } catch (err) {
      next(err);
    }
  }

  async getBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const budget = await budgetService.getBudget(userId, id);
      res.status(200).json({
        success: true,
        data: budget,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const budget = await budgetService.updateBudget(userId, id, req.body);
      res.status(200).json({
        success: true,
        data: budget,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await budgetService.deleteBudget(userId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const budgetController = new BudgetController();
export default budgetController;
