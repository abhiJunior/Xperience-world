import { Router } from 'express';
import * as chatController from '../../controllers/chatController.js';
import validate from '../../middleware/validate.js';
import {
  chatMessageSchema,
  actionDecisionSchema,
  whatIfSchema,
  chatHistoryQuerySchema,
} from '../../validators/chat.validator.js';

const router = Router({ mergeParams: true });

router
  .route('/')
  .post(validate(chatMessageSchema), chatController.sendMessage)
  .get(validate(chatHistoryQuerySchema, 'query'), chatController.getHistory);

router.post(
  '/actions/:actionId/confirm',
  validate(actionDecisionSchema),
  chatController.confirmAction
);

router.post(
  '/actions/:actionId/reject',
  validate(actionDecisionSchema),
  chatController.rejectAction
);

router.post(
  '/what-if',
  validate(whatIfSchema),
  chatController.runWhatIf
);

export default router;
