import { Router } from 'express';
import * as notificationController from '../../controllers/notificationController.js';

const router = Router({ mergeParams: true });

router.get('/', notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
