import { Request, Response, NextFunction } from 'express';
import { TxnType } from '@prisma/client';
import { categoryService } from '../services/categoryService.js';

export class CategoryController {
  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const type = req.query.type as TxnType | undefined;
      const categories = await categoryService.listCategories(userId, type);
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const category = await categoryService.createCategory(userId, req.body);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const category = await categoryService.getCategory(userId, id);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const category = await categoryService.updateCategory(userId, id, req.body);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await categoryService.deleteCategory(userId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async reorderCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { categoryIds } = req.body;
      const result = await categoryService.reorderCategories(userId, categoryIds);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
export default categoryController;
