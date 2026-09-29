import Suggestion from '../models/Suggestion.js';
import * as actionExecutor from './ai/actionExecutor.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * List pending suggestions for an event.
 *
 * @param {string} userId
 * @param {string} eventId
 */
export const listSuggestions = async (userId, eventId) => {
  await assertEventOwnership(eventId, userId);

  const suggestions = await Suggestion.find({ event: eventId, status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();

  return suggestions;
};

/**
 * Accept a suggestion: sequentially applies all embedded proposed actions to the event DB.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {string} suggestionId
 */
export const acceptSuggestion = async (userId, eventId, suggestionId) => {
  await assertEventOwnership(eventId, userId);

  const suggestion = await Suggestion.findOne({ _id: suggestionId, event: eventId });
  if (!suggestion) {
    throw new ApiError(404, 'Suggestion not found');
  }

  if (suggestion.status !== 'pending') {
    throw new ApiError(400, `Suggestion is already ${suggestion.status}`);
  }

  const results = [];
  for (const action of suggestion.proposedActions || []) {
    if (action.actionId) {
      try {
        const res = await actionExecutor.confirmAction(
          userId,
          eventId,
          action.actionId,
          `Accepted via suggestion "${suggestion.title}"`,
        );
        results.push(res);
      } catch (err) {
        logger.warn('Failed to apply sub-action of suggestion', {
          actionId: action.actionId,
          error: err.message,
        });
      }
    }
  }

  suggestion.status = 'accepted';
  await suggestion.save();

  logger.info('Suggestion accepted', { eventId, suggestionId, actionsApplied: results.length });

  return { suggestion, appliedActions: results };
};

/**
 * Dismiss a suggestion.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {string} suggestionId
 */
export const dismissSuggestion = async (userId, eventId, suggestionId) => {
  await assertEventOwnership(eventId, userId);

  const suggestion = await Suggestion.findOneAndUpdate(
    { _id: suggestionId, event: eventId },
    { $set: { status: 'dismissed' } },
    { new: true },
  );

  if (!suggestion) {
    throw new ApiError(404, 'Suggestion not found');
  }

  return suggestion;
};
