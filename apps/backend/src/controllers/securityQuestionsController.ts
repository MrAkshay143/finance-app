import { Request, Response, NextFunction } from 'express';
import { kbaService } from '../services/kbaService.js';

export class SecurityQuestionsController {
  async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const questions = await kbaService.getSecurityQuestions(userId);

      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (err) {
      next(err);
    }
  }

  async setupQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const questions = req.body.questions || req.body.answers;

      const result = await kbaService.setupSecurityQuestions(userId, questions);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      const email = req.body.email;
      const answers = req.body.answers || req.body.questions;

      const result = await kbaService.verifySecurityQuestions({ userId, email }, answers);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  getAvailable(_req: Request, res: Response): void {
    const questions = kbaService.getAvailableQuestions();
    res.status(200).json({
      success: true,
      data: questions,
    });
  }
}

export const securityQuestionsController = new SecurityQuestionsController();
export default securityQuestionsController;
