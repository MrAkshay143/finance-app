import { Request, Response, NextFunction } from 'express';
import { accountActionsService } from '../services/accountActionsService.js';
import { ValidationError } from '../utils/errors.js';

export class AccountActionsController {
  async resetProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { password } = req.body || {};
      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        throw new ValidationError('Password is required to confirm profile reset');
      }
      const result = await accountActionsService.resetProfile(userId, password, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { password } = req.body || {};
      if (!password || typeof password !== 'string') {
        throw new ValidationError('Password is required to confirm account deletion');
      }

      const result = await accountActionsService.deleteAccount(userId, password, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const accountActionsController = new AccountActionsController();
export default accountActionsController;
