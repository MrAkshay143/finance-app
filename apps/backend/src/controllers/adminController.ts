import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService.js';
import { categoryService } from '../services/categoryService.js';

export class AdminController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await adminService.getDashboardMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, pageSize, search, status, role, sortBy } = req.query;
      const result = await adminService.listUsers({
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        role: role ? String(role) : undefined,
        sortBy: sortBy ? String(sortBy) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const details = await adminService.getUserDetails(id);
      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const updated = await adminService.updateUser(adminId, id, req.body, req.ip);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async resetUserPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { newPassword } = req.body || {};
      const result = await adminService.resetUserPassword(adminId, id, newPassword, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async resetUserKba(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const result = await adminService.resetUserKba(adminId, id, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const result = await adminService.deleteUser(adminId, id, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAppSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await adminService.getAppSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAppSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const updated = await adminService.updateAppSettings(adminId, req.body, req.ip);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async listSystemAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, pageSize, search, action, category, startDate, endDate } = req.query;
      const result = await adminService.listSystemAuditLogs({
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        search: search ? String(search) : undefined,
        action: action ? String(action) : undefined,
        category: category ? String(category) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPlatformAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { timeframe } = req.query;
      const data = await adminService.getPlatformAnalytics(timeframe ? String(timeframe) : '30d');
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async exportUsersCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csvData = await adminService.exportUsersCsv();
      const filename = `institutional_users_report_${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvData);
    } catch (err) {
      next(err);
    }
  }

  async getSystemHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await adminService.getSystemHealth();
      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const sessions = await adminService.getUserSessions(id);
      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  }

  async revokeAllUserSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const result = await adminService.revokeAllUserSessions(id, adminId, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async clearCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const result = await adminService.clearRedisCache(adminId, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async runRecurring(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const result = await adminService.runRecurringMaterialization(adminId, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async exportAuditLogsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csvData = await adminService.exportAuditLogsCsv();
      const filename = `institutional_audit_logs_${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvData);
    } catch (err) {
      next(err);
    }
  }

  async purgeAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { retentionDays } = req.body || {};
      const result = await adminService.purgeOldAuditLogs(adminId, Number(retentionDays) || 90, req.ip);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listSystemCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.adminListSystemCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  async createSystemCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const category = await categoryService.adminCreateSystemCategory(adminId, req.body);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSystemCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const category = await categoryService.adminUpdateSystemCategory(adminId, id, req.body);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteSystemCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const result = await categoryService.adminDeleteSystemCategory(adminId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
export default adminController;
