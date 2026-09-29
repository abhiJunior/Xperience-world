import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * A single message turn in a conversation.
 * proposedActions: what the LLM suggested in this turn.
 * appliedActions:  subset that were actually executed.
 */
const messageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
    },
    // Raw action proposals returned by the LLM for this turn
    proposedActions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    // Subset of proposals that were actually applied (or remain pending)
    appliedActions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    // Actions awaiting user confirmation
    pendingActions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    // LLM token usage for cost tracking
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

/**
 * @typedef {Object} IConversation
 * @property {Types.ObjectId} event
 * @property {Object[]} messages
 */
const conversationSchema = new Schema(
  {
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: [true, 'Conversation must belong to an Event'],
      unique: true, // One conversation thread per event
      index: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const Conversation = model('Conversation', conversationSchema);
export default Conversation;
