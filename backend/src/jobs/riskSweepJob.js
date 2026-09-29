import Event from '../models/Event.js';
import Risk from '../models/Risk.js';
import * as riskEngine from '../services/engine/riskEngine.js';
import * as notificationService from '../services/notificationService.js';
import logger from '../utils/logger.js';

/**
 * Sweeps all active events to evaluate fresh risks and generates alerts for critical issues.
 */
export const runRiskSweep = async () => {
  logger.info('Starting automated background risk sweep...');

  try {
    const activeEvents = await Event.find({
      status: { $in: ['planning', 'confirmed'] },
    }).lean();

    let totalScanned = 0;
    let alertsCreated = 0;

    for (const event of activeEvents) {
      try {
        const scan = await riskEngine.evaluateEventRisks(event.owner, event._id);
        totalScanned++;

        // Find critical open risks to create notifications
        const criticalRisks = (scan.detectedRisks || []).filter((r) => r.severity === 'critical');

        for (const risk of criticalRisks) {
          await notificationService.createNotification({
            event: event._id,
            type: 'risk_alert',
            title: `Critical Risk Alert: ${risk.title}`,
            body: risk.explanation,
            relatedEntityKind: 'Risk',
          });
          alertsCreated++;
        }
      } catch (err) {
        logger.error('Error during risk sweep for event', {
          eventId: event._id,
          error: err.message,
        });
      }
    }

    logger.info('Background risk sweep completed', { totalScanned, alertsCreated });
  } catch (err) {
    logger.error('Fatal error in risk sweep job', { error: err.message });
  }
};
