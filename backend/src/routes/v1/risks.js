import { Router } from 'express';
import * as riskController from '../../controllers/riskController.js';
import validate from '../../middleware/validate.js';
import {
  updateRiskStatusSchema,
  listRisksQuerySchema,
} from '../../validators/risk.validator.js';

const router = Router({ mergeParams: true });

router
  .route('/')
  .get(validate(listRisksQuerySchema, 'query'), riskController.listRisks);

router.post('/scan', riskController.runRiskScan);

router.patch(
  '/:id/status',
  validate(updateRiskStatusSchema),
  riskController.updateRiskStatus
);

export default router;
