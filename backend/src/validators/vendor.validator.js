import { z } from 'zod';
import { VENDOR_CATEGORIES, VENDOR_STATUSES } from '../models/Vendor.js';

// ── Create Vendor ─────────────────────────────────────────────────────────────
export const createVendorSchema = z.object({
  name: z
    .string({ required_error: 'Vendor name is required' })
    .min(1, 'Name cannot be empty')
    .max(200)
    .trim(),

  category: z.enum(VENDOR_CATEGORIES, {
    required_error: 'Category is required',
    invalid_type_error: `Category must be one of: ${VENDOR_CATEGORIES.join(', ')}`,
  }),

  status: z.enum(VENDOR_STATUSES).optional().default('shortlisted'),

  contact: z
    .object({
      name: z.string().max(150).trim().optional().default(''),
      email: z.string().email('Must be a valid email').optional().or(z.literal('')).default(''),
      phone: z.string().max(30).trim().optional().default(''),
    })
    .optional()
    .default({}),

  capacity: z.number().int().min(0, 'Capacity cannot be negative').optional().default(0),

  cost: z.number().min(0, 'Cost cannot be negative').optional().default(0),

  notes: z.string().max(2000).optional().default(''),

  linkedSubEvents: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Each SubEvent ID must be a valid ObjectId'))
    .optional()
    .default([]),

  availability: z
    .array(
      z.object({
        subEvent: z.string().regex(/^[0-9a-fA-F]{24}$/, 'SubEvent ID must be a valid ObjectId'),
        available: z.boolean().default(true),
      }),
    )
    .optional()
    .default([]),
});

// ── Update Vendor ─────────────────────────────────────────────────────────────
export const updateVendorSchema = createVendorSchema.partial();

// ── Update vendor status only (e.g. one-click "Mark Confirmed") ───────────────
export const updateVendorStatusSchema = z.object({
  status: z.enum(VENDOR_STATUSES, { required_error: 'Status is required' }),
  notes: z.string().max(500).optional(),
});

// ── Query Vendors ─────────────────────────────────────────────────────────────
export const listVendorsQuerySchema = z.object({
  status: z.enum(VENDOR_STATUSES).optional(),
  category: z.enum(VENDOR_CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
