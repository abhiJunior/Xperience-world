/**
 * server.js — Entry point.
 * Responsibilities:
 *  1. Import app (Express) and config
 *  2. Connect to MongoDB
 *  3. Start the HTTP server
 *  4. Handle graceful shutdown (SIGTERM / SIGINT)
 */
import app from './app.js';
import connectDB from './src/config/db.js';
import env from './src/config/env.js';
import logger from './src/utils/logger.js';
import { startScheduler, stopScheduler } from './src/jobs/scheduler.js';

// Connect to DB, then start listening
const startServer = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Xperience Assistant API running`, {
      port: env.PORT,
      env: env.NODE_ENV,
      url: `http://localhost:${env.PORT}`,
    });

    // Start background cron jobs
    if (env.NODE_ENV !== 'test') {
      startScheduler();
    }
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    stopScheduler();
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit if connections linger beyond 10 s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled rejections / exceptions ────────────────────────────────────
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', { reason, promise });
    // Give the server a moment to respond to in-flight requests
    setTimeout(() => process.exit(1), 1000);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception — process will exit', { error: err.message, stack: err.stack });
    process.exit(1);
  });
};

startServer();
