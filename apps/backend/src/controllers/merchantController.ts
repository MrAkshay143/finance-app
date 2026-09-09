import { Request, Response, NextFunction } from 'express';
import { merchantService } from '../services/merchantService.js';

export class MerchantController {
  async listMerchants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const merchants = await merchantService.listMerchants(userId);
      res.status(200).json({
        success: true,
        data: merchants,
      });
    } catch (err) {
      next(err);
    }
  }

  async createMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const merchant = await merchantService.createMerchant(userId, req.body);
      res.status(201).json({
        success: true,
        data: merchant,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const merchant = await merchantService.getMerchant(userId, id);
      res.status(200).json({
        success: true,
        data: merchant,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const merchant = await merchantService.updateMerchant(userId, id, req.body);
      res.status(200).json({
        success: true,
        data: merchant,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await merchantService.deleteMerchant(userId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const merchantController = new MerchantController();
export default merchantController;
