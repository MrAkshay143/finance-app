import { Router } from 'express';
import { goalController } from '../controllers/goalController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { CreateGoalInputSchema, UpdateGoalInputSchema } from '@finance/shared-types';

export const goalsRouter: Router = Router();

// All goals routes require authentication
goalsRouter.use(authenticate);

// GET /api/v1/goals - List goals
goalsRouter.get('/', (req, res, next) => {
  goalController.listGoals(req, res, next);
});

// POST /api/v1/goals - Create a goal
goalsRouter.post('/', validateBody(CreateGoalInputSchema), (req, res, next) => {
  goalController.createGoal(req, res, next);
});

// GET /api/v1/goals/:id - Get single goal
goalsRouter.get('/:id', (req, res, next) => {
  goalController.getGoal(req, res, next);
});

// PUT /api/v1/goals/:id - Update goal
goalsRouter.put('/:id', validateBody(UpdateGoalInputSchema), (req, res, next) => {
  goalController.updateGoal(req, res, next);
});

// PATCH /api/v1/goals/:id - Update goal (alias)
goalsRouter.patch('/:id', validateBody(UpdateGoalInputSchema), (req, res, next) => {
  goalController.updateGoal(req, res, next);
});

// DELETE /api/v1/goals/:id - Soft-delete goal
goalsRouter.delete('/:id', (req, res, next) => {
  goalController.deleteGoal(req, res, next);
});

export default goalsRouter;
