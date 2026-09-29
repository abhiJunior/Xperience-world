import { z } from 'zod';

const REQUIREMENT_TYPES = [
  'guest_count',
  'vehicle_capacity',
  'room_capacity',
  'catering_headcount',
  'budget',
];

// ── Create Requirement ────────────────────────────────────────────────────────
export const createRequirementSchema = z.object({
  type: z.enum(REQUIREMENT_TYPES, {
    required_error: 'Requirement type is required',
    invalid_type_error: `Type must be one of: ${REQUIREMENT_TYPES.join(', ')}`,
  }),

  required: z
    .number({ required_error: 'Required value is required' })
    .min(0, 'Required value cannot be negative'),

  provided: z.number().min(0, 'Provided value cannot be negative').optional().default(0),

  sourceRef: z.string().max(500).optional().default(''),

  subEvent: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'subEvent must be a valid ObjectId')
    .nullable()
    .optional(),
});

// ── Update Requirement ────────────────────────────────────────────────────────
export const updateRequirementSchema = createRequirementSchema.partial();
