import { Router } from 'express';
import { remindersController } from '../controllers/remindersController.js';
import { authenticate } from '../middleware/authenticate.js';

export const remindersRouter: Router = Router();

remindersRouter.use(authenticate);

// GET /api/v1/reminders - List reminders
remindersRouter.get('/', (req, res, next) => {
  remindersController.list(req, res, next);
});

// POST /api/v1/reminders - Create reminder
remindersRouter.post('/', (req, res, next) => {
  remindersController.create(req, res, next);
});

// GET /api/v1/reminders/:id - Get reminder
remindersRouter.get('/:id', (req, res, next) => {
  remindersController.getById(req, res, next);
});

// PUT /api/v1/reminders/:id - Update reminder
remindersRouter.put('/:id', (req, res, next) => {
  remindersController.update(req, res, next);
});

// PATCH /api/v1/reminders/:id - Update reminder (alias)
remindersRouter.patch('/:id', (req, res, next) => {
  remindersController.update(req, res, next);
});

// DELETE /api/v1/reminders/:id - Delete reminder
remindersRouter.delete('/:id', (req, res, next) => {
  remindersController.delete(req, res, next);
});

// PATCH /api/v1/reminders/:id/status - Toggle/patch status
remindersRouter.patch('/:id/status', (req, res, next) => {
  remindersController.toggleStatus(req, res, next);
});

export default remindersRouter;
