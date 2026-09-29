import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * @typedef {Object} IGuestGroup
 * @property {Types.ObjectId} event
 * @property {string} label                 "Outstation guests", "Employees from other cities"
 * @property {number} count
 * @property {string} arrivalCity
 * @property {boolean} needsAccommodation
 * @property {boolean} needsTransport
 * @property {string} arrivalInfo           free-text arrival details / date-time
 * @property {Types.ObjectId[]} subEventsAttending
 */
const guestGroupSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: [true, 'GuestGroup must belong to an Event'],
      index: true,
    },
    label: {
      type: String,
      required: [true, 'Guest group label is required'],
      trim: true,
      maxlength: [200, 'Label must not exceed 200 characters'],
    },
    count: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [1, 'Guest count must be at least 1'],
    },
    arrivalCity: {
      type: String,
      trim: true,
      default: '',
    },
    needsAccommodation: {
      type: Boolean,
      default: false,
    },
    needsTransport: {
      type: Boolean,
      default: false,
    },
    arrivalInfo: {
      type: String,
      default: '',
    },
    subEventsAttending: [
      {
        type: Types.ObjectId,
        ref: 'SubEvent',
      },
    ],
  },
  { timestamps: true },
);

// event index is created by `index: true` on the field definition

const GuestGroup = model('GuestGroup', guestGroupSchema);
export default GuestGroup;
