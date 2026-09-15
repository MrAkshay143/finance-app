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

categoriesRouter.use(authenticate);

categoriesRouter.get('/', (req, res, next) => {
  categoryController.listCategories(req, res, next);
});

categoriesRouter.post('/', validateBody(CreateCategoryInputSchema), (req, res, next) => {
  categoryController.createCategory(req, res, next);
});

categoriesRouter.patch('/reorder', validateBody(ReorderCategoriesInputSchema), (req, res, next) => {
  categoryController.reorderCategories(req, res, next);
});

categoriesRouter.get('/:id', (req, res, next) => {
  categoryController.getCategory(req, res, next);
});

categoriesRouter.put('/:id', validateBody(UpdateCategoryInputSchema), (req, res, next) => {
  categoryController.updateCategory(req, res, next);
});

categoriesRouter.patch('/:id', validateBody(UpdateCategoryInputSchema), (req, res, next) => {
  categoryController.updateCategory(req, res, next);
});

categoriesRouter.delete('/:id', (req, res, next) => {
  categoryController.deleteCategory(req, res, next);
});

export default categoriesRouter;
