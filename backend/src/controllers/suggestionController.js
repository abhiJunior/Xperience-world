import * as suggestionService from '../services/suggestionService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await suggestionService.listSuggestions(
    req.user._id,
    req.params.eventId
  );
  sendSuccess(res, 200, suggestions);
});

export const acceptSuggestion = asyncHandler(async (req, res) => {
  const result = await suggestionService.acceptSuggestion(
    req.user._id,
    req.params.eventId,
    req.params.id
  );
  sendSuccess(res, 200, result, 'Suggestion accepted and applied');
});

export const dismissSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await suggestionService.dismissSuggestion(
    req.user._id,
    req.params.eventId,
    req.params.id
  );
  sendSuccess(res, 200, suggestion, 'Suggestion dismissed');
});
