import { Router } from 'express';
import * as guestGroupController from '../../controllers/guestGroupController.js';
import validate from '../../middleware/validate.js';
import {
  createGuestGroupSchema,
  updateGuestGroupSchema,
} from '../../validators/guestGroup.validator.js';

const router = Router({ mergeParams: true });

router
  .route('/')
  .post(validate(createGuestGroupSchema), guestGroupController.createGuestGroup)
  .get(guestGroupController.listGuestGroups);

router
  .route('/:id')
  .get(guestGroupController.getGuestGroup)
  .patch(validate(updateGuestGroupSchema), guestGroupController.updateGuestGroup)
  .delete(guestGroupController.deleteGuestGroup);

export default router;
