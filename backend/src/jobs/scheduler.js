import cron from 'node-cron';
import { runRiskSweep } from './riskSweepJob.js';
import { runTaskAlerts } from './taskAlertJob.js';
import { runProactiveSuggestions } from './proactiveSuggestionJob.js';
import logger from '../utils/logger.js';

let scheduledTasks = [];

/**
 * Initializes and starts all background cron jobs.
 */
export const startScheduler = () => {
  logger.info('Initializing background cron job scheduler...');

  // 1. Risk Sweep: runs every hour at minute 0
  const riskJob = cron.schedule('0 * * * *', async () => {
    logger.info('[CRON] Triggering automated risk sweep...');
    await runRiskSweep();
  });

  // 2. Task Deadline Alerts: runs every 30 minutes
  const taskAlertJob = cron.schedule('*/30 * * * *', async () => {
    logger.info('[CRON] Triggering task deadline alert scan...');
    await runTaskAlerts();
  });

  // 3. Proactive Suggestion Generator: runs every hour at minute 15
  const suggestionJob = cron.schedule('15 * * * *', async () => {
    logger.info('[CRON] Triggering proactive suggestion generator...');
    await runProactiveSuggestions();
  });

  scheduledTasks = [riskJob, taskAlertJob, suggestionJob];
  logger.info('Background cron scheduler active (3 jobs registered)');
};

/**
 * Stops all active cron schedules.
 */
export const stopScheduler = () => {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks = [];
  logger.info('Background cron scheduler stopped');
};

/**
 * Manually executes all jobs sequentially (useful for testing or on-demand sync).
 */
export const triggerAllJobsNow = async () => {
  logger.info('Manually running all background jobs on demand...');
  await runRiskSweep();
  await runTaskAlerts();
  await runProactiveSuggestions();
  logger.info('Manual run of background jobs completed');
};
