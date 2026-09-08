import { Request, Response, NextFunction } from 'express';
import { accountService } from '../services/accountService.js';

export class AccountController {
  async listAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await accountService.listAccounts(userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const account = await accountService.createAccount(userId, req.body);
      res.status(201).json({
        success: true,
        data: account,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const account = await accountService.getAccount(userId, id);
      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updated = await accountService.updateAccount(userId, id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleAccountStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { status } = req.body || {};
      const updated = await accountService.toggleAccountStatus(userId, id, status);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const accountController = new AccountController();
export default accountController;
