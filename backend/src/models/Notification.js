import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * In-app notification model.
 * Cron jobs (deadline reminders, daily briefings) write here;
 * the dashboard surfaces unread notifications.
 *
 * @typedef {Object} INotification
 * @property {Types.ObjectId} event
 * @property {'deadline_reminder'|'risk_alert'|'daily_briefing'|'suggestion'|'system'} type
 * @property {string} title
 * @property {string} body
 * @property {boolean} read
 * @property {Types.ObjectId} [relatedEntity]
 * @property {string} [relatedEntityKind]
 */
const notificationSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['deadline_reminder', 'risk_alert', 'daily_briefing', 'suggestion', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, 'Notification title must not exceed 300 characters'],
    },
    body: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedEntity: {
      type: Types.ObjectId,
      default: null,
    },
    relatedEntityKind: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ event: 1, read: 1, createdAt: -1 });

const Notification = model('Notification', notificationSchema);
export default Notification;
