import { z } from 'zod';
import { RISK_SEVERITIES, RISK_STATUSES } from '../models/Risk.js';

// ── Patch Risk status ─────────────────────────────────────────────────────────
export const updateRiskStatusSchema = z.object({
  status: z.enum(RISK_STATUSES, { required_error: 'Status is required' }),
  note: z.string().max(500).optional(),
});

// ── Query Risks ───────────────────────────────────────────────────────────────
export const listRisksQuerySchema = z.object({
  severity: z.enum(RISK_SEVERITIES).optional(),
  status: z.enum(RISK_STATUSES).optional(),
  detectedBy: z.enum(['rule', 'llm']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
