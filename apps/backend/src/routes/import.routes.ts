import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { importExportController } from '../controllers/importExportController.js';

export const importRouter: Router = Router();

importRouter.use(authenticate);

importRouter.post('/csv', (req, res, next) => importExportController.importCsv(req, res, next));
importRouter.post('/', (req, res, next) => importExportController.importCsv(req, res, next));

export default importRouter;
