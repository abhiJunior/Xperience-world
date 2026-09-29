import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * Task categories cover every major event-planning domain.
 * The 'other' bucket catches anything not explicitly listed.
 */
export const TASK_CATEGORIES = [
  'venue',
  'catering',
  'decor',
  'photography',
  'entertainment',
  'accommodation',
  'transport',
  'invitations',
  'branding',
  'activities',
  'other',
];

export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const TASK_SOURCES = ['chat', 'manual', 'ai_suggestion', 'system'];

/**
 * @typedef {Object} ITask
 * @property {Types.ObjectId} event
 * @property {Types.ObjectId} [subEvent]
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string} status
 * @property {string} priority
 * @property {Date}   dueDate
 * @property {string} assignee         free-text name or email
 * @property {Types.ObjectId[]} dependsOn   other Task ids
 * @property {string} blockedReason
 * @property {string} source
 */
const taskSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: [true, 'Task must belong to an Event'],
      index: true,
    },
    subEvent: {
      type: Types.ObjectId,
      ref: 'SubEvent',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [250, 'Task title must not exceed 250 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: TASK_CATEGORIES,
      required: [true, 'Task category is required'],
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    assignee: {
      type: String,
      trim: true,
      default: '',
    },
    // Task dependency graph — used by the dependencyEngine
    dependsOn: [
      {
        type: Types.ObjectId,
        ref: 'Task',
      },
    ],
    blockedReason: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: TASK_SOURCES,
      default: 'manual',
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
taskSchema.index({ event: 1, status: 1 });
taskSchema.index({ event: 1, dueDate: 1 });
taskSchema.index({ event: 1, category: 1 });
taskSchema.index({ event: 1, subEvent: 1 });

const Task = model('Task', taskSchema);
export default Task;
