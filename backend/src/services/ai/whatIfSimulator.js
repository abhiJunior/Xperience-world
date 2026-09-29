import Event from '../../models/Event.js';
import SubEvent from '../../models/SubEvent.js';
import Task from '../../models/Task.js';
import Vendor from '../../models/Vendor.js';
import GuestGroup from '../../models/GuestGroup.js';
import Requirement from '../../models/Requirement.js';
import * as impactEngine from '../engine/impactEngine.js';
import * as readinessEngine from '../engine/readinessEngine.js';
import { generateStructuredChat } from './llmClient.js';
import { SYSTEM_PROMPT, buildEventContextPrompt } from './prompts.js';
import assertEventOwnership from '../../utils/assertEventOwnership.js';
import logger from '../../utils/logger.js';

/**
 * Simulates a hypothetical "What-If" scenario for an event without mutating the database.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {string} scenarioDescription
 * @returns {Promise<{
 *   scenario: string,
 *   currentReadiness: object,
 *   impactAnalysis: object,
 *   hypotheticalActions: object[],
 *   aiAssessment: string,
 *   recommendations: string[]
 * }>}
 */
export const simulateWhatIf = async (userId, eventId, scenarioDescription) => {
  const event = await assertEventOwnership(eventId, userId);

  const [subEvents, tasks, vendors, guestGroups, requirements] = await Promise.all([
    SubEvent.find({ event: eventId }).lean(),
    Task.find({ event: eventId }).lean(),
    Vendor.find({ event: eventId }).lean(),
    GuestGroup.find({ event: eventId }).lean(),
    Requirement.find({ event: eventId }).lean(),
  ]);

  const currentReadiness = await readinessEngine.calculateEventReadiness(userId, eventId);

  // Determine what type of change the scenario implies
  let changeType = 'generic';
  const text = scenarioDescription.toLowerCase();
  const payload = {};

  if (text.includes('vendor') || text.includes('cancel') || text.includes('unavailable')) {
    changeType = 'vendor_change';
    const matchingVendor = vendors.find((v) =>
      text.includes(v.name.toLowerCase()) || text.includes(v.category.toLowerCase()),
    );
    payload.vendorId = matchingVendor?._id || 'hypothetical_vendor';
    payload.newStatus = 'unavailable';
    payload.category = matchingVendor?.category || (text.includes('venue') ? 'venue' : 'catering');
  } else if (text.includes('guest') || text.includes('people') || text.includes('attend')) {
    changeType = 'guest_count_change';
    const countMatch = text.match(/(\d+)/);
    payload.delta = countMatch ? parseInt(countMatch[1], 10) : 50;
  } else if (text.includes('budget') || text.includes('price') || text.includes('cost') || text.includes('expense')) {
    changeType = 'budget_change';
    const costMatch = text.match(/(\d+)/);
    payload.addedCost = costMatch ? parseInt(costMatch[1], 10) : 100000;
  }

  // Run impact engine calculation
  const impactAnalysis = await impactEngine.analyzeImpact(userId, eventId, {
    type: changeType,
    payload,
  });

  // Call LLM for expert risk assessment
  const contextStr = buildEventContextPrompt({
    event,
    subEvents,
    tasks,
    vendors,
    guestGroups,
    requirements,
  });

  const aiRes = await generateStructuredChat({
    systemPrompt: `${SYSTEM_PROMPT}\n\nThe user wants a "WHAT-IF" SIMULATION analysis. Do NOT apply changes. Provide a detailed risk assessment and recommendations.`,
    userPrompt: `WHAT-IF SCENARIO: "${scenarioDescription}"\nAnalyze all direct and indirect consequences if this scenario occurs.`,
    eventContext: contextStr,
  });

  logger.info('What-if simulation completed', { eventId, scenario: scenarioDescription });

  return {
    scenario: scenarioDescription,
    currentReadiness,
    impactAnalysis,
    hypotheticalActions: aiRes.proposedActions || [],
    aiAssessment: aiRes.reply,
    recommendations: impactAnalysis.suggestedActions || [
      'Evaluate contingency supplier options',
      'Prepare budget buffer allocation',
    ],
  };
};
