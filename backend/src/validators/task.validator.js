import { z } from 'zod';
import { TASK_CATEGORIES, TASK_STATUSES, TASK_PRIORITIES, TASK_SOURCES } from '../models/Task.js';

const objectId = () =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ObjectId').nullable().optional();

// ── Create Task ───────────────────────────────────────────────────────────────
export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .min(1, 'Title cannot be empty')
    .max(250)
    .trim(),

  description: z.string().max(2000).optional().default(''),

  category: z.enum(TASK_CATEGORIES, {
    required_error: 'Category is required',
    invalid_type_error: `Category must be one of: ${TASK_CATEGORIES.join(', ')}`,
  }),

  subEvent: objectId(),

  status: z.enum(TASK_STATUSES).optional().default('todo'),

  priority: z.enum(TASK_PRIORITIES).optional().default('medium'),

  dueDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .nullable()
    .optional(),

  assignee: z.string().max(200).trim().optional().default(''),

  dependsOn: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Each dependency must be a valid ObjectId'))
    .optional()
    .default([]),

  blockedReason: z.string().max(500).optional().default(''),

  source: z.enum(TASK_SOURCES).optional().default('manual'),
});

// ── Update Task (all optional) ────────────────────────────────────────────────
export const updateTaskSchema = createTaskSchema.partial();

// ── Query Tasks ───────────────────────────────────────────────────────────────
export const listTasksQuerySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  category: z.enum(TASK_CATEGORIES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  subEvent: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  dueBefore: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ── Bulk update status ────────────────────────────────────────────────────────
export const bulkUpdateTaskStatusSchema = z.object({
  taskIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/))
    .min(1, 'At least one task ID is required'),
  status: z.enum(TASK_STATUSES),
});
