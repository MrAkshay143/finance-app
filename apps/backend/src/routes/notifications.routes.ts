import { Router } from 'express';
import { notificationsController } from '../controllers/notificationsController.js';
import { authenticate } from '../middleware/authenticate.js';

export const notificationsRouter: Router = Router();

notificationsRouter.use(authenticate);

// GET /api/v1/notifications - List notifications
notificationsRouter.get('/', (req, res, next) => {
  notificationsController.list(req, res, next);
});

// GET /api/v1/notifications/unread-count - Get unread notifications count
notificationsRouter.get('/unread-count', (req, res, next) => {
  notificationsController.getUnreadCount(req, res, next);
});

// PATCH /api/v1/notifications/:id/read - Mark notification as read
notificationsRouter.patch('/:id/read', (req, res, next) => {
  notificationsController.markAsRead(req, res, next);
});

// POST /api/v1/notifications/:id/read - Mark notification as read (alias)
notificationsRouter.post('/:id/read', (req, res, next) => {
  notificationsController.markAsRead(req, res, next);
});

// POST /api/v1/notifications/mark-all-read - Mark all notifications as read
notificationsRouter.post('/mark-all-read', (req, res, next) => {
  notificationsController.markAllAsRead(req, res, next);
});

// PATCH /api/v1/notifications/mark-all-read - Mark all notifications as read (alias)
notificationsRouter.patch('/mark-all-read', (req, res, next) => {
  notificationsController.markAllAsRead(req, res, next);
});

export default notificationsRouter;
