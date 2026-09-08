import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import {
  CreateCategoryInputSchema,
  UpdateCategoryInputSchema,
  ReorderCategoriesInputSchema,
} from '@finance/shared-types';

export const categoriesRouter: Router = Router();

// All categories routes require authentication
categoriesRouter.use(authenticate);

// GET /api/v1/categories - List categories (system + user custom)
categoriesRouter.get('/', (req, res, next) => {
  categoryController.listCategories(req, res, next);
});

// POST /api/v1/categories - Create custom category
categoriesRouter.post('/', validateBody(CreateCategoryInputSchema), (req, res, next) => {
  categoryController.createCategory(req, res, next);
});

// PATCH /api/v1/categories/reorder - Reorder categories
categoriesRouter.patch('/reorder', validateBody(ReorderCategoriesInputSchema), (req, res, next) => {
  categoryController.reorderCategories(req, res, next);
});

// GET /api/v1/categories/:id - Get single category
categoriesRouter.get('/:id', (req, res, next) => {
  categoryController.getCategory(req, res, next);
});

// PUT /api/v1/categories/:id - Update category (403 if isSystem)
categoriesRouter.put('/:id', validateBody(UpdateCategoryInputSchema), (req, res, next) => {
  categoryController.updateCategory(req, res, next);
});

// DELETE /api/v1/categories/:id - Delete category (403 if isSystem)
categoriesRouter.delete('/:id', (req, res, next) => {
  categoryController.deleteCategory(req, res, next);
});

export default categoriesRouter;
