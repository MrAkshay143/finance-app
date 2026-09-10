import { Router } from 'express';
import { profileController } from '../controllers/profileController.js';
import { userSettingsController } from '../controllers/userSettingsController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import {
  UpdateBasicProfileInputSchema,
  UpdateFinanceProfileInputSchema,
  UpdateUserSettingsSchema,
} from '@finance/shared-types';

export const profileRouter: Router = Router();

// All profile endpoints require authentication
profileRouter.use(authenticate);

// Get complete profile
profileRouter.get('/', (req, res, next) => {
  profileController.getProfile(req, res, next);
});

// Update basic profile (supports PUT and PATCH)
profileRouter.put('/basic', validateBody(UpdateBasicProfileInputSchema), (req, res, next) => {
  profileController.updateBasicProfile(req, res, next);
});

profileRouter.patch('/basic', validateBody(UpdateBasicProfileInputSchema), (req, res, next) => {
  profileController.updateBasicProfile(req, res, next);
});

// Update profile root (alias for basic profile update)
profileRouter.patch('/', validateBody(UpdateBasicProfileInputSchema), (req, res, next) => {
  profileController.updateBasicProfile(req, res, next);
});

// Finance profile endpoints
profileRouter.get('/finance', (req, res, next) => {
  profileController.getFinanceProfile(req, res, next);
});

profileRouter.put('/finance', validateBody(UpdateFinanceProfileInputSchema), (req, res, next) => {
  profileController.updateFinanceProfile(req, res, next);
});

profileRouter.patch('/finance', validateBody(UpdateFinanceProfileInputSchema), (req, res, next) => {
  profileController.updateFinanceProfile(req, res, next);
});

// Upload user avatar image
profileRouter.post('/avatar', (req, res, next) => {
  profileController.uploadAvatar(req, res, next);
});

// Delete user avatar image
profileRouter.delete('/avatar', (req, res, next) => {
  profileController.deleteAvatar(req, res, next);
});

// User settings endpoints under profile
profileRouter.get('/settings', (req, res, next) => {
  userSettingsController.getSettings(req, res, next);
});

profileRouter.patch('/settings', validateBody(UpdateUserSettingsSchema), (req, res, next) => {
  userSettingsController.updateSettings(req, res, next);
});

profileRouter.put('/settings', validateBody(UpdateUserSettingsSchema), (req, res, next) => {
  userSettingsController.updateSettings(req, res, next);
});

export default profileRouter;
