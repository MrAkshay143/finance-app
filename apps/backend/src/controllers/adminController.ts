import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService.js';

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
      const result = await adminService.resetUserPassword(adminId, id, req.ip);
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
}

export const adminController = new AdminController();
export default adminController;
