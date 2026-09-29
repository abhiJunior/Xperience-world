import { Router } from 'express';
import * as suggestionController from '../../controllers/suggestionController.js';

const router = Router({ mergeParams: true });

router.get('/', suggestionController.listSuggestions);
router.post('/:id/accept', suggestionController.acceptSuggestion);
router.post('/:id/dismiss', suggestionController.dismissSuggestion);

export default router;
