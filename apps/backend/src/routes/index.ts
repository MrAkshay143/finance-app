import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { profileRouter } from './profile.routes.js';
import { securityQuestionsRouter } from './securityQuestions.routes.js';
import { accountsRouter } from './accounts.routes.js';
import { categoriesRouter } from './categories.routes.js';
import { merchantsRouter } from './merchants.routes.js';
import { transactionsRouter } from './transactions.routes.js';
import { transfersRouter } from './transfers.routes.js';
import { budgetsRouter } from './budgets.routes.js';
import { goalsRouter } from './goals.routes.js';
import { recurringTransactionsRouter } from './recurringTransactions.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { analyticsRouter } from './analytics.routes.js';
import { reportsRouter } from './reports.routes.js';
import { aiAnalysisRouter } from './aiAnalysis.routes.js';
import { investmentsRouter } from './investments.routes.js';
import { notificationsRouter } from './notifications.routes.js';
import { remindersRouter } from './reminders.routes.js';
import { userSettingsRouter } from './userSettings.routes.js';
import { accountActionsRouter } from './accountActions.routes.js';
import { auditRouter } from './audit.routes.js';
import { importRouter } from './import.routes.js';
import { exportRouter } from './export.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiV1Router: Router = Router();

// Version response header per Plan/architecture.md §4
apiV1Router.use((_req, res, next) => {
  res.setHeader('X-API-Version', '1');
  next();
});

// Mount all resource route groups per Plan/backend.md §4
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/profile', profileRouter);
apiV1Router.use('/security-questions', securityQuestionsRouter);
apiV1Router.use('/accounts', accountsRouter);
apiV1Router.use('/categories', categoriesRouter);
apiV1Router.use('/merchants', merchantsRouter);
apiV1Router.use('/transactions', transactionsRouter);
apiV1Router.use('/transfers', transfersRouter);
apiV1Router.use('/budgets', budgetsRouter);
apiV1Router.use('/goals', goalsRouter);
apiV1Router.use('/recurring-transactions', recurringTransactionsRouter);
apiV1Router.use('/dashboard', dashboardRouter);
apiV1Router.use('/analytics', analyticsRouter);
apiV1Router.use('/reports', reportsRouter);
apiV1Router.use('/ai-analysis', aiAnalysisRouter);
apiV1Router.use('/investments', investmentsRouter);
apiV1Router.use('/notifications', notificationsRouter);
apiV1Router.use('/reminders', remindersRouter);
apiV1Router.use('/user-settings', userSettingsRouter);
apiV1Router.use('/account-actions', accountActionsRouter);
apiV1Router.use('/audit', auditRouter);
apiV1Router.use('/import', importRouter);
apiV1Router.use('/export', exportRouter);
apiV1Router.use('/admin', adminRouter);

// Catch-all for unhandled /api/v1 routes returns 501 NOT_IMPLEMENTED
apiV1Router.all('*', (_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Endpoint not implemented',
    },
  });
});

export default apiV1Router;
