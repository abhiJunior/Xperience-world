import { z } from 'zod';

const dateString = () =>
  z
    .string()
    .datetime({ message: 'Must be a valid ISO 8601 date string' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)'));

// ── Base shape (no cross-field refinements) — shared by create + update ───────
const eventBaseShape = {
  title: z
    .string({ required_error: 'Event title is required' })
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),

  type: z.enum(['wedding', 'corporate', 'conference', 'other']).optional().default('other'),

  status: z
    .enum(['planning', 'confirmed', 'live', 'completed'])
    .optional()
    .default('planning'),

  startDate: dateString(),

  endDate: dateString(),

  city: z.string().max(100).trim().optional().default(''),

  expectedGuests: z.number().int().min(0).optional().default(0),

  confirmedGuests: z.number().int().min(0).optional().default(0),

  budget: z
    .object({
      total: z.number().min(0).optional().default(0),
      spent: z.number().min(0).optional().default(0),
      currency: z.string().max(10).trim().optional().default('INR'),
    })
    .optional()
    .default({}),

  summary: z.string().max(2000).optional().default(''),
};

// ── Create Event — startDate & endDate required, cross-field date check ───────
export const createEventSchema = z
  .object(eventBaseShape)
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

// ── Update Event — all fields optional (no refinement to allow .partial()) ────
// Cross-field check is enforced in the service layer for updates.
export const updateEventSchema = z.object({
  title: eventBaseShape.title.optional(),
  type: eventBaseShape.type,
  status: eventBaseShape.status,
  startDate: dateString().optional(),
  endDate: dateString().optional(),
  city: eventBaseShape.city,
  expectedGuests: eventBaseShape.expectedGuests,
  confirmedGuests: eventBaseShape.confirmedGuests,
  budget: eventBaseShape.budget,
  summary: eventBaseShape.summary,
});

// ── Query params ──────────────────────────────────────────────────────────────
export const listEventsQuerySchema = z.object({
  status: z.enum(['planning', 'confirmed', 'live', 'completed']).optional(),
  type: z.enum(['wedding', 'corporate', 'conference', 'other']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
