import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ── Create SubEvent ───────────────────────────────────────────────────────────
export const createSubEventSchema = z.object({
  name: z
    .string({ required_error: 'SubEvent name is required' })
    .min(1, 'Name cannot be empty')
    .max(150)
    .trim(),

  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')),

  startTime: z
    .string()
    .regex(timeRegex, 'startTime must be in HH:MM (24-hour) format')
    .optional()
    .default('09:00'),

  endTime: z
    .string()
    .regex(timeRegex, 'endTime must be in HH:MM (24-hour) format')
    .optional()
    .default('22:00'),

  venueId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'venueId must be a valid ObjectId')
    .nullable()
    .optional(),

  expectedGuests: z.number().int().min(0).optional().default(0),

  status: z
    .enum(['planning', 'confirmed', 'live', 'completed', 'cancelled'])
    .optional()
    .default('planning'),

  notes: z.string().max(1000).optional().default(''),
});

// ── Update SubEvent ───────────────────────────────────────────────────────────
export const updateSubEventSchema = createSubEventSchema.partial();

// ── Query ─────────────────────────────────────────────────────────────────────
export const listSubEventsQuerySchema = z.object({
  status: z.enum(['planning', 'confirmed', 'live', 'completed', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
