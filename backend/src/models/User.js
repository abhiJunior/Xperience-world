import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

/**
 * @typedef {Object} IUser
 * @property {string} name
 * @property {string} email
 * @property {string} passwordHash
 * @property {'manager'|'admin'} role
 * @property {string[]} refreshTokens - stored hashed refresh tokens
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ['manager', 'admin'],
      default: 'manager',
    },
    // Stores hashed refresh tokens to support multi-device and revocation
    refreshTokens: {
      type: [String],
      select: false,
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        return ret;
      },
    },
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });

// ── Instance methods ──────────────────────────────────────────────────────────

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>}
 */
userSchema.statics.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain-text password against the stored hash.
 * @param {string} candidate
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
userSchema.statics.comparePassword = async (candidate, hash) => {
  return bcrypt.compare(candidate, hash);
};

const User = model('User', userSchema);
export default User;
