import crypto from 'crypto';
import Event from '../models/Event.js';
import Risk from '../models/Risk.js';
import Suggestion from '../models/Suggestion.js';
import logger from '../utils/logger.js';

/**
 * Scans active open risks and generates actionable one-click suggestions for the event manager.
 */
export const runProactiveSuggestions = async () => {
  logger.info('Starting proactive suggestion generator...');

  try {
    const openRisks = await Risk.find({ status: 'open' }).lean();
    let suggestionsCreated = 0;

    for (const risk of openRisks) {
      // Check if a pending suggestion already exists for this risk
      const existing = await Suggestion.findOne({
        event: risk.event,
        sourceRisk: risk._id,
        status: 'pending',
      });

      if (existing) continue;

      const proposedActions = [];
      let suggestionTitle = `Recommendation: Resolve ${risk.title}`;

      if (risk.type === 'capacity_gap' && risk.title.toLowerCase().includes('transport')) {
        proposedActions.push({
          actionId: crypto.randomUUID(),
          type: 'create_task',
          description: 'Contact bus and fleet transport vendors for backup vehicles',
          payload: {
            title: 'Book additional transport vehicles',
            category: 'transport',
            priority: 'high',
          },
        });
      } else if (risk.type === 'missing_vendor') {
        const category = risk.title.toLowerCase().includes('venue') ? 'venue' : 'catering';
        proposedActions.push({
          actionId: crypto.randomUUID(),
          type: 'create_task',
          description: `Shortlist and schedule tastings / site visits for ${category}`,
          payload: {
            title: `Shortlist 3 verified ${category} vendors`,
            category,
            priority: 'critical',
          },
        });
      } else if (risk.type === 'task_blocked') {
        proposedActions.push({
          actionId: crypto.randomUUID(),
          type: 'create_task',
          description: `Expedite blocker resolution for task: ${risk.title.replace('Blocked Task: ', '')}`,
          payload: {
            title: `Follow up to unblock: ${risk.title.replace('Blocked Task: ', '')}`,
            category: 'other',
            priority: 'high',
          },
        });
      }

      if (proposedActions.length > 0) {
        await Suggestion.create({
          event: risk.event,
          title: suggestionTitle,
          reason: risk.explanation,
          proposedActions,
          status: 'pending',
          createdBy: 'rule_engine',
          sourceRisk: risk._id,
        });
        suggestionsCreated++;
      }
    }

    logger.info('Proactive suggestion generator finished', { suggestionsCreated });
  } catch (err) {
    logger.error('Error in proactive suggestion job', { error: err.message });
  }
};
