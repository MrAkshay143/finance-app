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

// Reports and Analytics
adminRouter.get('/reports/analytics', (req, res, next) =>
  adminController.getPlatformAnalytics(req, res, next)
);
adminRouter.get('/reports/users/export', (req, res, next) =>
  adminController.exportUsersCsv(req, res, next)
);

// System telemetry & health
adminRouter.get('/system/health', (req, res, next) => adminController.getSystemHealth(req, res, next));

// Users management
adminRouter.get('/users', (req, res, next) => adminController.listUsers(req, res, next));
adminRouter.get('/users/:id', (req, res, next) => adminController.getUserDetails(req, res, next));
adminRouter.patch('/users/:id', (req, res, next) => adminController.updateUser(req, res, next));
adminRouter.get('/users/:id/sessions', (req, res, next) =>
  adminController.getUserSessions(req, res, next)
);
adminRouter.post('/users/:id/sessions/revoke-all', (req, res, next) =>
  adminController.revokeAllUserSessions(req, res, next)
);
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

// Maintenance & Cache Actions
adminRouter.post('/maintenance/clear-cache', (req, res, next) => adminController.clearCache(req, res, next));
adminRouter.post('/maintenance/run-recurring', (req, res, next) => adminController.runRecurring(req, res, next));

// Audit logs (supports both /audit and /audit-logs)
adminRouter.get('/audit/export', (req, res, next) => adminController.exportAuditLogsCsv(req, res, next));
adminRouter.post('/audit/purge', (req, res, next) => adminController.purgeAuditLogs(req, res, next));
adminRouter.post('/maintenance/purge-audit-logs', (req, res, next) => adminController.purgeAuditLogs(req, res, next));
adminRouter.get('/audit', (req, res, next) => adminController.listSystemAuditLogs(req, res, next));
adminRouter.get('/audit-logs', (req, res, next) => adminController.listSystemAuditLogs(req, res, next));

export default adminRouter;
