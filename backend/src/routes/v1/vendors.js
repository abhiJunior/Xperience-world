import { Router } from 'express';
import * as vendorController from '../../controllers/vendorController.js';
import validate from '../../middleware/validate.js';
import {
  createVendorSchema,
  updateVendorSchema,
  updateVendorStatusSchema,
  listVendorsQuerySchema,
} from '../../validators/vendor.validator.js';

const router = Router({ mergeParams: true });

router
  .route('/')
  .post(validate(createVendorSchema), vendorController.createVendor)
  .get(validate(listVendorsQuerySchema, 'query'), vendorController.listVendors);

router.patch(
  '/:id/status',
  validate(updateVendorStatusSchema),
  vendorController.updateVendorStatus
);

router
  .route('/:id')
  .get(vendorController.getVendor)
  .patch(validate(updateVendorSchema), vendorController.updateVendor)
  .delete(vendorController.deleteVendor);

export default router;
