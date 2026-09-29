import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

export const RISK_SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const RISK_STATUSES = ['open', 'acknowledged', 'resolved', 'dismissed'];
export const RISK_DETECTED_BY = ['rule', 'llm'];

/**
 * @typedef {Object} IRisk
 * @property {Types.ObjectId} event
 * @property {string} type              e.g. "capacity_gap", "vendor_unavailable"
 * @property {'low'|'medium'|'high'|'critical'} severity
 * @property {string} title
 * @property {string} explanation
 * @property {{ kind: string, id: Types.ObjectId }[]} affectedEntities
 * @property {string[]} suggestedActions
 * @property {'open'|'acknowledged'|'resolved'|'dismissed'} status
 * @property {'rule'|'llm'} detectedBy
 * @property {string} fingerprint   SHA hash of (event + type + key fields) for deduplication
 */
const riskSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: [true, 'Risk must belong to an Event'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Risk type is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: RISK_SEVERITIES,
      required: [true, 'Risk severity is required'],
    },
    title: {
      type: String,
      required: [true, 'Risk title is required'],
      trim: true,
      maxlength: [300, 'Title must not exceed 300 characters'],
    },
    explanation: {
      type: String,
      default: '',
    },
    // Polymorphic references — kind is the model name (e.g. "Task", "Vendor")
    affectedEntities: [
      {
        kind: { type: String, required: true },
        id: { type: Types.ObjectId, required: true, refPath: 'affectedEntities.kind' },
      },
    ],
    suggestedActions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: RISK_STATUSES,
      default: 'open',
    },
    detectedBy: {
      type: String,
      enum: RISK_DETECTED_BY,
      default: 'rule',
    },
    // Fingerprint is used to prevent duplicate risks being created on every scan.
    // It should be a hash of (eventId + type + a stable key from the affected entity).
    fingerprint: {
      type: String,
      required: [true, 'Fingerprint is required for deduplication'],
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
riskSchema.index({ event: 1, status: 1 });
riskSchema.index({ event: 1, severity: 1 });
// Unique fingerprint per event prevents duplicate risks from repeated scans
riskSchema.index({ event: 1, fingerprint: 1 }, { unique: true });

const Risk = model('Risk', riskSchema);
export default Risk;
