import { z } from 'zod';

// ── Create GuestGroup ─────────────────────────────────────────────────────────
export const createGuestGroupSchema = z.object({
  label: z
    .string({ required_error: 'Guest group label is required' })
    .min(1, 'Label cannot be empty')
    .max(200)
    .trim(),

  count: z
    .number({ required_error: 'Guest count is required' })
    .int('Count must be a whole number')
    .min(1, 'Count must be at least 1'),

  arrivalCity: z.string().max(150).trim().optional().default(''),

  needsAccommodation: z.boolean().optional().default(false),

  needsTransport: z.boolean().optional().default(false),

  arrivalInfo: z.string().max(500).optional().default(''),

  subEventsAttending: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Each SubEvent ID must be a valid ObjectId'))
    .optional()
    .default([]),
});

// ── Update GuestGroup ─────────────────────────────────────────────────────────
export const updateGuestGroupSchema = createGuestGroupSchema.partial();
