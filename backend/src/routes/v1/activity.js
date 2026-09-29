import { Router } from 'express';
import * as activityController from '../../controllers/activityController.js';

const router = Router({ mergeParams: true });

router.get('/', activityController.listActivityLogs);

export default router;
