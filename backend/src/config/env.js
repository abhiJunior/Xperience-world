import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root (two levels up from src/config/)
config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Strongly-typed environment configuration.
 * Fail fast on missing critical variables so the app never boots half-configured.
 */
const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, defaultValue = '') => process.env[key] || defaultValue;

const env = {
  // ── Server ────────────────────────────────────────────────────────────────
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),
  LOG_LEVEL: optional('LOG_LEVEL', 'info'),

  // ── MongoDB ───────────────────────────────────────────────────────────────
  MONGODB_URI: required('MONGODB_URI'),

  // ── JWT ───────────────────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_ACCESS_EXPIRY: optional('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRY: optional('JWT_REFRESH_EXPIRY', '7d'),

  // ── LLM (provider-agnostic) ───────────────────────────────────────────────
  LLM_PROVIDER: optional('LLM_PROVIDER', 'gemini'), // gemini | openai | anthropic
  GEMINI_API_KEY: optional('GEMINI_API_KEY'),
  OPENAI_API_KEY: optional('OPENAI_API_KEY'),
  ANTHROPIC_API_KEY: optional('ANTHROPIC_API_KEY'),
  LLM_MODEL: optional('LLM_MODEL', 'gemini-1.5-pro'),
  LLM_TIMEOUT_MS: parseInt(optional('LLM_TIMEOUT_MS', '30000'), 10),

  // ── CORS ──────────────────────────────────────────────────────────────────
  CORS_ORIGINS: optional('CORS_ORIGINS', 'http://localhost:3000'),
};

export default env;
