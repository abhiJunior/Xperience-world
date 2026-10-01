import Conversation from '../../models/Conversation.js';
import ActivityLog from '../../models/ActivityLog.js';
import Suggestion from '../../models/Suggestion.js';
import * as subEventService from '../subEventService.js';
import * as taskService from '../taskService.js';
import * as vendorService from '../vendorService.js';
import * as guestGroupService from '../guestGroupService.js';
import * as requirementService from '../requirementService.js';
import * as eventService from '../eventService.js';
import * as riskEngine from '../engine/riskEngine.js';
import * as readinessEngine from '../engine/readinessEngine.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';
import assertEventOwnership from '../../utils/assertEventOwnership.js';

import { TASK_CATEGORIES } from '../../models/Task.js';
import { VENDOR_CATEGORIES, VENDOR_STATUSES } from '../../models/Vendor.js';

/**
 * Executes a confirmed proposed action against the database, updates the conversation
 * turn status, records an activity log, and runs a fresh risk evaluation.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {string} actionId
 * @param {string} [userNote]
 * @returns {Promise<{ action: object, appliedResult: object, newReadiness: object }>}
 */
export const confirmAction = async (userId, eventId, actionId, userNote = '') => {
  await assertEventOwnership(eventId, userId);

  // 1. Locate the proposed action in the event's Conversation or Suggestion
  const conversation = await Conversation.findOne({ event: eventId });

  let foundAction = null;
  let targetMessage = null;
  let targetSuggestion = null;

  if (conversation) {
    for (const msg of conversation.messages) {
      const action = (msg.proposedActions || []).find((a) => a.actionId === actionId);
      if (action) {
        foundAction = action;
        targetMessage = msg;
        break;
      }
    }
  }

  // Also check Suggestion collection if not in conversation
  if (!foundAction) {
    const suggestion = await Suggestion.findOne({ event: eventId, 'proposedActions.actionId': actionId });
    if (suggestion) {
      foundAction = suggestion.proposedActions.find((a) => a.actionId === actionId);
      targetSuggestion = suggestion;
    }
  }

  if (!foundAction) {
    throw new ApiError(404, `Action "${actionId}" not found or already processed`);
  }

  if (foundAction.status === 'accepted') {
    throw new ApiError(400, 'Action has already been accepted and executed');
  }

  // 2. Dispatch to the appropriate resource service
  let appliedResult = null;
  const { type, payload = {} } = foundAction;

  switch (type) {
    case 'create_sub_event': {
      const subPayload = { ...payload };
      if (subPayload.name && subPayload.name.length > 150) {
        subPayload.name = subPayload.name.slice(0, 147) + '...';
      }
      appliedResult = await subEventService.createSubEvent(userId, eventId, subPayload);
      break;
    }

    case 'update_sub_event': {
      const { subEventId, ...dto } = payload;
      appliedResult = await subEventService.updateSubEvent(userId, eventId, subEventId, dto);
      break;
    }

    case 'create_task': {
      const taskPayload = { ...payload };
      if (taskPayload.title && taskPayload.title.length > 250) {
        taskPayload.title = taskPayload.title.slice(0, 247) + '...';
      }
      if (!taskPayload.category || !TASK_CATEGORIES.includes(taskPayload.category)) {
        taskPayload.category = 'other';
      }
      appliedResult = await taskService.createTask(userId, eventId, taskPayload);
      break;
    }

    case 'update_task': {
      const { taskId, ...dto } = payload;
      appliedResult = await taskService.updateTask(userId, eventId, taskId, dto);
      break;
    }

    case 'create_vendor': {
      const vendorPayload = { ...payload };
      if (vendorPayload.name && vendorPayload.name.length > 200) {
        vendorPayload.name = vendorPayload.name.slice(0, 197) + '...';
      }
      if (!vendorPayload.category || !VENDOR_CATEGORIES.includes(vendorPayload.category)) {
        vendorPayload.category = 'other';
      }
      if (vendorPayload.status && !VENDOR_STATUSES.includes(vendorPayload.status)) {
        vendorPayload.status = 'shortlisted';
      }
      appliedResult = await vendorService.createVendor(userId, eventId, vendorPayload);
      break;
    }

    case 'update_vendor': {
      const { vendorId, ...dto } = payload;
      appliedResult = await vendorService.updateVendor(userId, eventId, vendorId, dto);
      break;
    }

    case 'create_guest_group': {
      appliedResult = await guestGroupService.createGuestGroup(userId, eventId, payload);
      break;
    }

    case 'update_guest_group': {
      const { groupId, ...dto } = payload;
      appliedResult = await guestGroupService.updateGuestGroup(userId, eventId, groupId, dto);
      break;
    }

    case 'create_requirement': {
      const reqPayload = { ...payload };
      reqPayload.required = Number(reqPayload.required) || 0;
      reqPayload.provided = Number(reqPayload.provided) || 0;
      appliedResult = await requirementService.createRequirement(userId, eventId, reqPayload);
      break;
    }

    case 'update_requirement': {
      const { reqId, ...dto } = payload;
      appliedResult = await requirementService.updateRequirement(userId, eventId, reqId, dto);
      break;
    }

    case 'update_event':
      appliedResult = await eventService.updateEvent(userId, eventId, payload);
      break;

    default:
      throw new ApiError(400, `Unsupported action type: "${type}"`);
  }

  // 3. Mark the action as accepted in the Conversation document
  foundAction.status = 'accepted';
  foundAction.confirmedAt = new Date();
  foundAction.userNote = userNote;

  if (targetMessage) {
    targetMessage.pendingActions = (targetMessage.pendingActions || []).filter(
      (a) => a.actionId !== actionId
    );
    targetMessage.appliedActions = targetMessage.appliedActions || [];
    targetMessage.appliedActions.push({
      ...foundAction,
      appliedResultId: appliedResult?._id,
    });
  }

  if (conversation) {
    conversation.markModified('messages');
    await conversation.save();
  }
  if (targetSuggestion) {
    targetSuggestion.markModified('proposedActions');
    await targetSuggestion.save();
  }

  // 4. Record Activity Log
  await ActivityLog.create({
    event: eventId,
    actor: 'user',
    actorId: userId,
    action: `action.confirmed:${type}`,
    entityKind: type.split('_')[1] || 'Entity',
    entityId: appliedResult?._id,
    after: appliedResult,
    conversationMessageId: targetMessage?._id,
    summary: `Confirmed action: ${foundAction.description || type}`,
  });

  // 5. Trigger automatic risk evaluation and calculate new readiness score
  await riskEngine.evaluateEventRisks(userId, eventId);
  const newReadiness = await readinessEngine.calculateEventReadiness(userId, eventId);

  logger.info('Action confirmed and executed', {
    eventId,
    actionId,
    type,
    appliedResultId: appliedResult?._id,
  });

  return {
    action: foundAction,
    appliedResult,
    newReadiness,
  };
};

/**
 * Rejects a proposed action.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {string} actionId
 * @param {string} [userNote]
 */
export const rejectAction = async (userId, eventId, actionId, userNote = '') => {
  await assertEventOwnership(eventId, userId);

  const conversation = await Conversation.findOne({ event: eventId });

  let foundAction = null;
  let targetMessage = null;
  let targetSuggestion = null;

  if (conversation) {
    for (const msg of conversation.messages) {
      const action = (msg.proposedActions || []).find((a) => a.actionId === actionId);
      if (action) {
        foundAction = action;
        targetMessage = msg;
        break;
      }
    }
  }

  if (!foundAction) {
    const suggestion = await Suggestion.findOne({ event: eventId, 'proposedActions.actionId': actionId });
    if (suggestion) {
      foundAction = suggestion.proposedActions.find((a) => a.actionId === actionId);
      targetSuggestion = suggestion;
    }
  }

  if (!foundAction) {
    throw new ApiError(404, `Action "${actionId}" not found`);
  }

  foundAction.status = 'rejected';
  foundAction.rejectedAt = new Date();
  foundAction.userNote = userNote;

  if (targetMessage) {
    targetMessage.pendingActions = (targetMessage.pendingActions || []).filter(
      (a) => a.actionId !== actionId
    );
  }

  if (conversation) {
    conversation.markModified('messages');
    await conversation.save();
  }
  if (targetSuggestion) {
    targetSuggestion.markModified('proposedActions');
    await targetSuggestion.save();
  }

  // Record Activity Log
  await ActivityLog.create({
    event: eventId,
    actor: 'user',
    actorId: userId,
    action: `action.rejected:${foundAction.type}`,
    entityKind: foundAction.type.split('_')[1] || 'Entity',
    conversationMessageId: targetMessage?._id,
    summary: `Rejected action: ${foundAction.description || foundAction.type}${userNote ? ` (Note: ${userNote})` : ''}`,
  });

  logger.info('Action rejected by user', { eventId, actionId, type: foundAction.type, userNote });

  return { action: foundAction };
};
