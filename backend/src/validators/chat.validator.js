import { z } from 'zod';

// ── Chat message ──────────────────────────────────────────────────────────────
export const chatMessageSchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message must not exceed 4000 characters')
    .trim(),
});

// ── Confirm / reject a pending action ────────────────────────────────────────
export const actionDecisionSchema = z.object({
  // Optional user note explaining their decision
  note: z.string().max(500).optional(),
});

// ── What-if scenario ──────────────────────────────────────────────────────────
export const whatIfSchema = z.object({
  scenario: z
    .string({ required_error: 'Scenario description is required' })
    .min(5, 'Scenario must be at least 5 characters')
    .max(2000)
    .trim(),
});

// ── Chat history query ────────────────────────────────────────────────────────
export const chatHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
