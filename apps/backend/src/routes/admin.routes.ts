import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { adminController } from '../controllers/adminController.js';

export const adminRouter: Router = Router();

// Enforce authentication AND requireAdmin for all admin routes
adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

// Dashboard metrics
adminRouter.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));

// Users management
adminRouter.get('/users', (req, res, next) => adminController.listUsers(req, res, next));
adminRouter.get('/users/:id', (req, res, next) => adminController.getUserDetails(req, res, next));
adminRouter.patch('/users/:id', (req, res, next) => adminController.updateUser(req, res, next));
adminRouter.post('/users/:id/reset-password', (req, res, next) =>
  adminController.resetUserPassword(req, res, next)
);
adminRouter.post('/users/:id/reset-kba', (req, res, next) =>
  adminController.resetUserKba(req, res, next)
);
adminRouter.delete('/users/:id', (req, res, next) => adminController.deleteUser(req, res, next));

// App settings management (supports both /settings and /app-settings)
adminRouter.get('/settings', (req, res, next) => adminController.getAppSettings(req, res, next));
adminRouter.patch('/settings', (req, res, next) => adminController.updateAppSettings(req, res, next));
adminRouter.get('/app-settings', (req, res, next) => adminController.getAppSettings(req, res, next));
adminRouter.patch('/app-settings', (req, res, next) =>
  adminController.updateAppSettings(req, res, next)
);

// Audit logs (supports both /audit and /audit-logs)
adminRouter.get('/audit', (req, res, next) => adminController.listSystemAuditLogs(req, res, next));
adminRouter.get('/audit-logs', (req, res, next) => adminController.listSystemAuditLogs(req, res, next));

export default adminRouter;
