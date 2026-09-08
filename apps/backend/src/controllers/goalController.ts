import { Request, Response, NextFunction } from 'express';
import { goalService } from '../services/goalService.js';

export class GoalController {
  async listGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const goals = await goalService.listGoals(userId);
      res.status(200).json({
        success: true,
        data: goals,
      });
    } catch (err) {
      next(err);
    }
  }

  async createGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const goal = await goalService.createGoal(userId, req.body);
      res.status(201).json({
        success: true,
        data: goal,
      });
    } catch (err) {
      next(err);
    }
  }

  async getGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const goal = await goalService.getGoal(userId, id);
      res.status(200).json({
        success: true,
        data: goal,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const goal = await goalService.updateGoal(userId, id, req.body);
      res.status(200).json({
        success: true,
        data: goal,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await goalService.deleteGoal(userId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const goalController = new GoalController();
export default goalController;
