import { Router } from 'express';
import * as eventController from '../../controllers/eventController.js';
import * as dashboardController from '../../controllers/dashboardController.js';
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
import riskRouter from './risks.js';
import chatRouter from './chat.js';
import notificationRouter from './notifications.js';
import suggestionRouter from './suggestions.js';
import activityRouter from './activity.js';

const router = Router();

// Protect all event routes
router.use(authenticate);

// ─── Dashboard, Readiness & Impact routes ──────────────────────────────────────
router.get('/:eventId/dashboard', dashboardController.getEventDashboard);
router.get('/:eventId/readiness', dashboardController.getEventReadiness);
router.post('/:eventId/impact', dashboardController.analyzeImpact);

// ─── Nested resource sub-routers ─────────────────────────────────────────────
router.use('/:eventId/sub-events', subEventRouter);
router.use('/:eventId/tasks', taskRouter);
router.use('/:eventId/vendors', vendorRouter);
router.use('/:eventId/guest-groups', guestGroupRouter);
router.use('/:eventId/requirements', requirementRouter);
router.use('/:eventId/risks', riskRouter);
router.use('/:eventId/chat', chatRouter);
router.use('/:eventId/notifications', notificationRouter);
router.use('/:eventId/suggestions', suggestionRouter);
router.use('/:eventId/activity', activityRouter);

// ─── Event CRUD ───────────────────────────────────────────────────────────────
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
