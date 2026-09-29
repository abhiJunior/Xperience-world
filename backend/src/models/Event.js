import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * @typedef {Object} IEvent
 * @property {Types.ObjectId} owner
 * @property {string} title
 * @property {'wedding'|'corporate'|'conference'|'other'} type
 * @property {'planning'|'confirmed'|'live'|'completed'} status
 * @property {Date} startDate
 * @property {Date} endDate
 * @property {string} city
 * @property {number} expectedGuests
 * @property {number} confirmedGuests
 * @property {{ total: number, spent: number }} budget
 * @property {number} readinessScore  0-100
 * @property {string} summary         AI-generated snapshot
 */
const eventSchema = new Schema(
  {
    owner: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'Event must have an owner'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    type: {
      type: String,
      enum: ['wedding', 'corporate', 'conference', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['planning', 'confirmed', 'live', 'completed'],
      default: 'planning',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (v) {
          return v >= this.startDate;
        },
        message: 'End date must be on or after start date',
      },
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    expectedGuests: {
      type: Number,
      min: [0, 'Expected guests cannot be negative'],
      default: 0,
    },
    confirmedGuests: {
      type: Number,
      min: [0, 'Confirmed guests cannot be negative'],
      default: 0,
    },
    budget: {
      total: { type: Number, min: 0, default: 0 },
      spent: { type: Number, min: 0, default: 0 },
    },
    readinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    summary: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
eventSchema.index({ owner: 1, status: 1 });
eventSchema.index({ owner: 1, startDate: 1 });

const Event = model('Event', eventSchema);
export default Event;
