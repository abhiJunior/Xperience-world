import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * Immutable audit trail of every state change in the system.
 * The "before" and "after" fields capture the document delta so
 * the activity feed can show exactly what changed.
 *
 * @typedef {Object} IActivityLog
 * @property {Types.ObjectId} event
 * @property {'user'|'ai'|'system'|'cron'} actor
 * @property {Types.ObjectId} [actorId]              User id when actor === 'user'
 * @property {string} action                         e.g. "task.created", "vendor.status_changed"
 * @property {string} entityKind                     Model name of the affected document
 * @property {Types.ObjectId} [entityId]
 * @property {Object} [before]                       Document state before the change
 * @property {Object} [after]                        Document state after the change
 * @property {Types.ObjectId} [conversationMessageId]
 * @property {string} [summary]                      Human-readable one-liner
 */
const activityLogSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: [true, 'ActivityLog must belong to an Event'],
      index: true,
    },
    actor: {
      type: String,
      enum: ['user', 'ai', 'system', 'cron'],
      required: [true, 'Actor is required'],
    },
    actorId: {
      type: Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: [true, 'Action string is required'],
      trim: true,
    },
    entityKind: {
      type: String,
      trim: true,
      default: '',
    },
    entityId: {
      type: Types.ObjectId,
      default: null,
    },
    before: {
      type: Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: Schema.Types.Mixed,
      default: null,
    },
    conversationMessageId: {
      type: Types.ObjectId,
      default: null,
    },
    summary: {
      type: String,
      default: '',
    },
  },
  {
    // createdAt is the log timestamp; no updatedAt needed (immutable)
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
activityLogSchema.index({ event: 1, createdAt: -1 }); // Feed is most-recent-first
activityLogSchema.index({ event: 1, actor: 1 });

const ActivityLog = model('ActivityLog', activityLogSchema);
export default ActivityLog;
