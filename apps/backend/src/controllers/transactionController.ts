import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transactionService.js';

export class TransactionController {
  async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await transactionService.listTransactions(userId, req.query as any);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const transaction = await transactionService.createTransaction(userId, req.body);
      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const transaction = await transactionService.getTransaction(userId, id);
      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updated = await transactionService.updateTransaction(userId, id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await transactionService.deleteTransaction(userId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const transactionController = new TransactionController();
export default transactionController;
