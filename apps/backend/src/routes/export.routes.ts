import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { importExportController } from '../controllers/importExportController.js';

export const exportRouter: Router = Router();

exportRouter.use(authenticate);

exportRouter.get('/data', (req, res, next) => importExportController.exportData(req, res, next));
exportRouter.get('/', (req, res, next) => importExportController.exportData(req, res, next));

export default exportRouter;
