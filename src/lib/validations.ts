import { z } from 'zod';

// Auth validations
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password must be less than 72 characters');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .max(100, 'Name must be less than 100 characters')
    .optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Service validations
export const serviceSchema = z.object({
  name: z
    .string()
    .min(1, 'Service ID is required')
    .max(100, 'Service ID must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Service ID must be lowercase alphanumeric with hyphens'),
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  status: z.enum(['healthy', 'degraded', 'down']).default('healthy'),
});

// Alert validations
export const alertSchema = z.object({
  name: z
    .string()
    .min(1, 'Alert name is required')
    .max(100, 'Alert name must be less than 100 characters'),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  service_id: z.string().uuid().optional().nullable(),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message must be less than 500 characters'),
  metric_name: z
    .string()
    .min(1, 'Metric name is required')
    .max(100, 'Metric name must be less than 100 characters'),
  threshold: z.number().min(0, 'Threshold must be positive'),
  current_value: z.number(),
});

// Incident validations
export const incidentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  service_id: z.string().uuid().optional().nullable(),
});

// SLO validations
export const sloSchema = z.object({
  name: z
    .string()
    .min(1, 'SLO name is required')
    .max(100, 'SLO name must be less than 100 characters'),
  service_id: z.string().uuid().optional().nullable(),
  target_availability: z
    .number()
    .min(0, 'Must be at least 0')
    .max(100, 'Must be at most 100'),
  latency_target: z.number().min(0, 'Must be positive'),
  error_budget_total: z
    .number()
    .min(0, 'Must be at least 0')
    .max(100, 'Must be at most 100'),
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type AlertInput = z.infer<typeof alertSchema>;
export type IncidentInput = z.infer<typeof incidentSchema>;
export type SLOInput = z.infer<typeof sloSchema>;
