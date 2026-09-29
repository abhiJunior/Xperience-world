import { Router } from 'express';
import * as taskController from '../../controllers/taskController.js';
import validate from '../../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  bulkUpdateTaskStatusSchema,
} from '../../validators/task.validator.js';

const router = Router({ mergeParams: true });

router
  .route('/')
  .post(validate(createTaskSchema), taskController.createTask)
  .get(validate(listTasksQuerySchema, 'query'), taskController.listTasks);

router.patch(
  '/bulk-status',
  validate(bulkUpdateTaskStatusSchema),
  taskController.bulkUpdateStatus
);

router
  .route('/:id')
  .get(taskController.getTask)
  .patch(validate(updateTaskSchema), taskController.updateTask)
  .delete(taskController.deleteTask);

export default router;
