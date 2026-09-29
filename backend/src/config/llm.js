/**
 * LLM provider configuration.
 * Centralises model identifiers and default inference parameters so they
 * can be overridden via environment without touching business logic.
 */
import env from './env.js';

const llmConfig = {
  provider: env.LLM_PROVIDER, // 'gemini' | 'openai' | 'anthropic'
  model: env.LLM_MODEL,
  timeoutMs: env.LLM_TIMEOUT_MS,

  /** Default generation parameters (overridable per-call) */
  defaults: {
    temperature: 0.2,   // Low temp → more deterministic structured output
    maxTokens: 4096,
  },

  /** Model identifiers per provider (can be overridden via LLM_MODEL env var) */
  models: {
    gemini: {
      default: 'gemini-1.5-pro',
      fast: 'gemini-1.5-flash',
    },
    openai: {
      default: 'gpt-4o',
      fast: 'gpt-4o-mini',
    },
    anthropic: {
      default: 'claude-3-5-sonnet-20241022',
      fast: 'claude-3-haiku-20240307',
    },
  },
};

export default llmConfig;
