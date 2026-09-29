import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import env from './env.js';

/**
 * Establishes a Mongoose connection to MongoDB Atlas.
 * Retries are handled automatically by Mongoose's built-in reconnection logic
 * (serverSelectionTimeoutMS controls how long to wait per attempt).
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host} [db: ${conn.connection.name}]`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected — Mongoose will attempt to reconnect');
    });
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err.message });
    process.exit(1); // Fatal — no point running without a database
  }
};

export default connectDB;
