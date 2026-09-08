import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService.js';

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { filter, page, pageSize } = req.query;
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const sizeNum = pageSize ? parseInt(pageSize as string, 10) : 20;

      const data = await notificationService.listNotifications(
        userId,
        (filter as 'all' | 'unread' | 'read') || 'all',
        pageNum,
        sizeNum
      );
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);
      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = await notificationService.markAsRead(userId, id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await notificationService.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
export default notificationsController;
