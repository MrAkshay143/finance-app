import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { importExportController } from '../controllers/importExportController.js';

export const importRouter: Router = Router();

importRouter.use(authenticate);

importRouter.post('/csv', idempotencyMiddleware, (req, res, next) => importExportController.importCsv(req, res, next));
importRouter.post('/', idempotencyMiddleware, (req, res, next) => importExportController.importCsv(req, res, next));

export default importRouter;
