import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { auditController } from '../controllers/auditController.js';

export const auditRouter: Router = Router();

auditRouter.use(authenticate);

auditRouter.get('/', (req, res, next) => auditController.listUserAuditLogs(req, res, next));

export default auditRouter;
