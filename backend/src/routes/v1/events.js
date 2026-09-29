import { Router } from 'express';
import * as eventController from '../../controllers/eventController.js';
import { authenticate } from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} from '../../validators/event.validator.js';

// Child routers
import subEventRouter from './subEvents.js';
import taskRouter from './tasks.js';
import vendorRouter from './vendors.js';
import guestGroupRouter from './guestGroups.js';
import requirementRouter from './requirements.js';

const router = Router();

// Protect all event routes
router.use(authenticate);

// Nested resource sub-routers
router.use('/:eventId/sub-events', subEventRouter);
router.use('/:eventId/tasks', taskRouter);
router.use('/:eventId/vendors', vendorRouter);
router.use('/:eventId/guest-groups', guestGroupRouter);
router.use('/:eventId/requirements', requirementRouter);

// Event CRUD
router
  .route('/')
  .post(validate(createEventSchema), eventController.createEvent)
  .get(validate(listEventsQuerySchema, 'query'), eventController.listEvents);

router
  .route('/:id')
  .get(eventController.getEvent)
  .patch(validate(updateEventSchema), eventController.updateEvent)
  .delete(eventController.deleteEvent);

export default router;
