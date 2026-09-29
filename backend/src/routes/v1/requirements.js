import { Router } from 'express';
import * as requirementController from '../../controllers/requirementController.js';
import validate from '../../middleware/validate.js';
import {
  createRequirementSchema,
  updateRequirementSchema,
} from '../../validators/requirement.validator.js';

const router = Router({ mergeParams: true });

router
  .route('/')
  .post(validate(createRequirementSchema), requirementController.createRequirement)
  .get(requirementController.listRequirements);

router
  .route('/:id')
  .get(requirementController.getRequirement)
  .patch(validate(updateRequirementSchema), requirementController.updateRequirement)
  .delete(requirementController.deleteRequirement);

export default router;
