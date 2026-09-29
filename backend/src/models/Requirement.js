import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * Requirement tracks numeric constraints for capacity / headcount checks.
 * The riskEngine compares `provided` vs `required` to detect gaps.
 *
 * @typedef {Object} IRequirement
 * @property {Types.ObjectId} event
 * @property {'guest_count'|'vehicle_capacity'|'room_capacity'|'catering_headcount'|'budget'} type
 * @property {number} required       e.g. 200 guests needing transport
 * @property {number} provided       e.g. 150 vehicle seats confirmed
 * @property {string} sourceRef      human-readable origin ("Transport vendor: ABC Travels")
 * @property {Types.ObjectId} [subEvent]   scope to a specific sub-event if relevant
 */
const requirementSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: [true, 'Requirement must belong to an Event'],
      index: true,
    },
    subEvent: {
      type: Types.ObjectId,
      ref: 'SubEvent',
      default: null,
    },
    type: {
      type: String,
      enum: ['guest_count', 'vehicle_capacity', 'room_capacity', 'catering_headcount', 'budget'],
      required: [true, 'Requirement type is required'],
    },
    required: {
      type: Number,
      required: [true, 'Required value is required'],
      min: [0, 'Required value cannot be negative'],
    },
    provided: {
      type: Number,
      default: 0,
      min: [0, 'Provided value cannot be negative'],
    },
    sourceRef: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

requirementSchema.index({ event: 1, type: 1 });

const Requirement = model('Requirement', requirementSchema);
export default Requirement;
