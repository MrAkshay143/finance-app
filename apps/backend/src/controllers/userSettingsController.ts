import { Request, Response, NextFunction } from 'express';
import { userSettingsService } from '../services/userSettingsService.js';

export class UserSettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const settings = await userSettingsService.getUserSettings(userId);
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const updated = await userSettingsService.updateUserSettings(userId, req.body, req.ip);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const userSettingsController = new UserSettingsController();
export default userSettingsController;
