import Event from '../models/Event.js';
import Task from '../models/Task.js';
import * as notificationService from '../services/notificationService.js';
import logger from '../utils/logger.js';

/**
 * Scans active events for overdue tasks and tasks due in the next 24 hours.
 */
export const runTaskAlerts = async () => {
  logger.info('Starting background task deadline alert check...');

  try {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const activeEvents = await Event.find({
      status: { $in: ['planning', 'confirmed'] },
    }).lean();

    let alertsSent = 0;

    for (const event of activeEvents) {
      // Find overdue tasks
      const overdueTasks = await Task.find({
        event: event._id,
        status: { $ne: 'done' },
        dueDate: { $lt: now },
      }).lean();

      for (const t of overdueTasks) {
        await notificationService.createNotification({
          event: event._id,
          type: 'deadline_reminder',
          title: `Overdue Task: "${t.title}"`,
          body: `Task was due on ${new Date(t.dueDate).toLocaleDateString()}. Status is currently "${t.status}".`,
          relatedEntity: t._id,
          relatedEntityKind: 'Task',
        });
        alertsSent++;
      }

      // Find tasks due in next 24 hours
      const upcomingTasks = await Task.find({
        event: event._id,
        status: { $ne: 'done' },
        dueDate: { $gte: now, $lte: next24h },
      }).lean();

      for (const t of upcomingTasks) {
        await notificationService.createNotification({
          event: event._id,
          type: 'deadline_reminder',
          title: `Task Due Today: "${t.title}"`,
          body: `Reminder: Task is scheduled for completion today (${new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`,
          relatedEntity: t._id,
          relatedEntityKind: 'Task',
        });
        alertsSent++;
      }
    }

    logger.info('Task deadline alert check completed', { alertsSent });
  } catch (err) {
    logger.error('Error in task alert job', { error: err.message });
  }
};
