import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * @typedef {Object} ISubEvent
 * @property {Types.ObjectId} event
 * @property {string} name            e.g. "Sangeet", "Haldi", "Reception"
 * @property {Date}   date
 * @property {string} startTime       "HH:MM" 24-hour
 * @property {string} endTime         "HH:MM" 24-hour
 * @property {Types.ObjectId} [venueId]  Linked Vendor acting as venue
 * @property {number} expectedGuests
 * @property {'planning'|'confirmed'|'live'|'completed'|'cancelled'} status
 * @property {string} notes
 */
const subEventSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: [true, 'SubEvent must belong to an Event'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'SubEvent name is required'],
      trim: true,
      maxlength: [150, 'SubEvent name must not exceed 150 characters'],
    },
    date: {
      type: Date,
      required: [true, 'SubEvent date is required'],
    },
    startTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:MM format'],
      default: '09:00',
    },
    endTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be in HH:MM format'],
      default: '22:00',
    },
    // Reference to a Vendor document that acts as the venue
    venueId: {
      type: Types.ObjectId,
      ref: 'Vendor',
      default: null,
    },
    expectedGuests: {
      type: Number,
      min: [0, 'Expected guests cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['planning', 'confirmed', 'live', 'completed', 'cancelled'],
      default: 'planning',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
subEventSchema.index({ event: 1, date: 1 });

const SubEvent = model('SubEvent', subEventSchema);
export default SubEvent;
