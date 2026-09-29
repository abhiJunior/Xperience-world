import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * @typedef {Object} ISuggestion
 * @property {Types.ObjectId} event
 * @property {string} title
 * @property {string} reason            Why this was suggested
 * @property {Object[]} proposedActions Array of action objects (same shape as chatOrchestrator)
 * @property {'pending'|'accepted'|'dismissed'} status
 * @property {'ai'|'rule_engine'|'system'} createdBy
 */
const suggestionSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: [true, 'Suggestion must belong to an Event'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Suggestion title is required'],
      trim: true,
      maxlength: [300, 'Title must not exceed 300 characters'],
    },
    reason: {
      type: String,
      default: '',
    },
    // Proposed actions follow the same schema as chatOrchestrator actions.
    // Stored as Mixed so they can carry any action type payload.
    proposedActions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'dismissed'],
      default: 'pending',
    },
    createdBy: {
      type: String,
      enum: ['ai', 'rule_engine', 'system'],
      default: 'rule_engine',
    },
    // Link to the risk that generated this suggestion (if applicable)
    sourceRisk: {
      type: Types.ObjectId,
      ref: 'Risk',
      default: null,
    },
  },
  { timestamps: true },
);

suggestionSchema.index({ event: 1, status: 1 });

const Suggestion = model('Suggestion', suggestionSchema);
export default Suggestion;
