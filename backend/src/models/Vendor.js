import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

export const VENDOR_CATEGORIES = [
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

export const VENDOR_STATUSES = [
  'shortlisted',
  'negotiating',
  'confirmed',
  'unavailable',
  'cancelled',
];

/**
 * @typedef {Object} IVendor
 * @property {Types.ObjectId} event
 * @property {string} name
 * @property {string} category
 * @property {string} status
 * @property {{ name?: string, email?: string, phone?: string }} contact
 * @property {number} capacity            0 = unlimited / not applicable
 * @property {number} cost                quoted / agreed cost
 * @property {string} notes
 * @property {Types.ObjectId[]} linkedSubEvents
 * @property {{ subEvent: ObjectId, available: boolean }[]} availability
 */
const vendorSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: [true, 'Vendor must belong to an Event'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      maxlength: [200, 'Vendor name must not exceed 200 characters'],
    },
    category: {
      type: String,
      enum: VENDOR_CATEGORIES,
      required: [true, 'Vendor category is required'],
    },
    status: {
      type: String,
      enum: VENDOR_STATUSES,
      default: 'shortlisted',
    },
    contact: {
      name: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    // For transport: seats; for venue: capacity; 0 = N/A
    capacity: {
      type: Number,
      min: [0, 'Capacity cannot be negative'],
      default: 0,
    },
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    // Sub-events this vendor is assigned to
    linkedSubEvents: [
      {
        type: Types.ObjectId,
        ref: 'SubEvent',
      },
    ],
    // Per-sub-event availability (used by riskEngine to detect conflicts)
    availability: [
      {
        subEvent: { type: Types.ObjectId, ref: 'SubEvent', required: true },
        available: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
vendorSchema.index({ event: 1, status: 1 });
vendorSchema.index({ event: 1, category: 1 });

const Vendor = model('Vendor', vendorSchema);
export default Vendor;
