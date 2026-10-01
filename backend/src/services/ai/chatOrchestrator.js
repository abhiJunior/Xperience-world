import Conversation from '../../models/Conversation.js';
import Event from '../../models/Event.js';
import SubEvent from '../../models/SubEvent.js';
import Task from '../../models/Task.js';
import Vendor from '../../models/Vendor.js';
import GuestGroup from '../../models/GuestGroup.js';
import Requirement from '../../models/Requirement.js';
import Risk from '../../models/Risk.js';
import * as impactEngine from '../engine/impactEngine.js';
import { generateStructuredChat } from './llmClient.js';
import { SYSTEM_PROMPT, buildEventContextPrompt } from './prompts.js';
import assertEventOwnership from '../../utils/assertEventOwnership.js';
import logger from '../../utils/logger.js';

/**
 * Maps a proposed action type to an impact analysis trigger.
 */
const mapActionToImpact = (type, payload) => {
  if (type.includes('vendor')) {
    return { type: 'vendor_change', payload };
  }
  if (type.includes('guest')) {
    return { type: 'guest_count_change', payload: { delta: payload?.count || 0 } };
  }
  if (type.includes('sub_event')) {
    return { type: 'sub_event_change', payload };
  }
  if (type.includes('task') && payload?.status === 'blocked') {
    return { type: 'task_blocked', payload };
  }
  return { type: 'generic', payload };
};

/**
 * Handles an incoming chat message from the event manager.
 * Extracts intent, drafts proposed actions, evaluates cascading impact,
 * and records the message turn in the event's conversation history.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {string} messageContent
 * @returns {Promise<{
 *   messageId: string,
 *   reply: string,
 *   proposedActions: object[],
 *   timestamp: Date
 * }>}
 */
export const processChatMessage = async (userId, eventId, messageContent) => {
  const event = await assertEventOwnership(eventId, userId);

  // 1. Gather all live event state for LLM context
  const [subEvents, tasks, vendors, guestGroups, requirements, risks] = await Promise.all([
    SubEvent.find({ event: eventId }).lean(),
    Task.find({ event: eventId }).lean(),
    Vendor.find({ event: eventId }).lean(),
    GuestGroup.find({ event: eventId }).lean(),
    Requirement.find({ event: eventId }).lean(),
    Risk.find({ event: eventId, status: 'open' }).lean(),
  ]);

  const eventContext = buildEventContextPrompt({
    event,
    subEvents,
    tasks,
    vendors,
    guestGroups,
    requirements,
    risks,
  });

  // 2. Call LLM for structured intent extraction and response generation
  const llmResult = await generateStructuredChat({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: messageContent,
    eventContext,
    rawContext: {
      event,
      subEvents,
      tasks,
      vendors,
      guestGroups,
      requirements,
      risks,
    },
  });

  // 3. For each proposed action, run deterministic impact analysis
  const enrichedActions = [];
  for (const action of llmResult.proposedActions || []) {
    const impactTrigger = mapActionToImpact(action.type, action.payload);
    const impact = await impactEngine.analyzeImpact(userId, eventId, impactTrigger);

    enrichedActions.push({
      actionId: action.actionId,
      type: action.type,
      description: action.description,
      payload: action.payload,
      status: 'pending',
      impact: {
        severity: impact.severity,
        summary: impact.summary,
        affectedEntities: impact.affectedEntities,
        suggestedActions: impact.suggestedActions,
      },
    });
  }

  // 4. Retrieve or create Conversation document
  let conversation = await Conversation.findOne({ event: eventId });
  if (!conversation) {
    conversation = await Conversation.create({ event: eventId, messages: [] });
  }

  // 5. Append User turn
  conversation.messages.push({
    role: 'user',
    content: messageContent,
    timestamp: new Date(),
  });

  // 6. Append Assistant turn
  const assistantTurn = {
    role: 'assistant',
    content: llmResult.reply,
    proposedActions: enrichedActions,
    pendingActions: enrichedActions,
    tokenUsage: llmResult.tokenUsage,
    timestamp: new Date(),
  };

  conversation.messages.push(assistantTurn);
  await conversation.save();

  // Get the newly saved assistant message id
  const savedMsg = conversation.messages[conversation.messages.length - 1];

  logger.info('Chat message processed', {
    eventId,
    proposedActionsCount: enrichedActions.length,
    messageId: savedMsg._id,
  });

  return {
    messageId: savedMsg._id,
    reply: llmResult.reply,
    proposedActions: enrichedActions,
    timestamp: savedMsg.timestamp,
  };
};

/**
 * Retrieves chat history for an event with pagination.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {object} [query]
 */
export const getChatHistory = async (userId, eventId, query = {}) => {
  await assertEventOwnership(eventId, userId);
  const { limit = 50 } = query;

  const conversation = await Conversation.findOne({ event: eventId }).lean();
  if (!conversation) {
    return { messages: [], total: 0 };
  }

  const messages = (conversation.messages || []).slice(-limit);
  return {
    messages,
    total: conversation.messages.length,
  };
};
