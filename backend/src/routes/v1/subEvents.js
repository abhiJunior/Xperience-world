import { Router } from 'express';
import * as subEventController from '../../controllers/subEventController.js';
import validate from '../../middleware/validate.js';
import {
  createSubEventSchema,
  updateSubEventSchema,
  listSubEventsQuerySchema,
} from '../../validators/subEvent.validator.js';

const router = Router({ mergeParams: true });

router
  .route('/')
  .post(validate(createSubEventSchema), subEventController.createSubEvent)
  .get(validate(listSubEventsQuerySchema, 'query'), subEventController.listSubEvents);

router
  .route('/:id')
  .get(subEventController.getSubEvent)
  .patch(validate(updateSubEventSchema), subEventController.updateSubEvent)
  .delete(subEventController.deleteSubEvent);

export default router;
