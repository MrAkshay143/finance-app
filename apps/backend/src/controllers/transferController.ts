import { Request, Response, NextFunction } from 'express';
import { transferService } from '../services/transferService.js';

export class TransferController {
  async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const transfer = await transferService.createTransfer(userId, req.body);
      res.status(201).json({
        success: true,
        data: transfer,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const transfer = await transferService.getTransfer(userId, id);
      res.status(200).json({
        success: true,
        data: transfer,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await transferService.deleteTransfer(userId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const transfers = await transferService.listTransfers(userId);
      res.status(200).json({
        success: true,
        data: transfers,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const transferController = new TransferController();
export default transferController;
