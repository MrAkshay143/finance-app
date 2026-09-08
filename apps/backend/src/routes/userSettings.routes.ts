import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { UpdateUserSettingsSchema } from '@finance/shared-types';
import { userSettingsController } from '../controllers/userSettingsController.js';

export const userSettingsRouter: Router = Router();

userSettingsRouter.use(authenticate);

userSettingsRouter.get('/', (req, res, next) => userSettingsController.getSettings(req, res, next));
userSettingsRouter.patch('/', validateBody(UpdateUserSettingsSchema), (req, res, next) =>
  userSettingsController.updateSettings(req, res, next)
);

export default userSettingsRouter;
