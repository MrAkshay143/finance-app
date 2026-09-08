import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/auditService.js';

export class AuditController {
  async listUserAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page, pageSize, search, category } = req.query;

      const result = await auditService.listUserAuditLogs(userId, {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const auditController = new AuditController();
export default auditController;
