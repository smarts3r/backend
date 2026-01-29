import { z } from 'zod';

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  price: z.number().positive('Price must be positive'),
  old_price: z.number().positive('Old price must be positive').optional().nullable(),
  category_id: z.number().int().positive('Category ID must be a positive integer'),
  img: z.string().url('Image must be a valid URL'),
  stock: z.number().int().nonnegative('Stock must be non-negative').optional().default(10),
  description: z.string().max(1000, 'Description is too long').optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
  price: z.number().positive('Price must be positive').optional(),
  old_price: z.number().positive('Old price must be positive').optional().nullable(),
  category_id: z.number().int().positive('Category ID must be a positive integer').optional(),
  img: z.string().url('Image must be a valid URL').optional(),
  stock: z.number().int().nonnegative('Stock must be non-negative').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
});

export const productIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a numeric string').transform(Number),
});

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must be at most 100 characters long'),
  username: z.string().min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must be at most 30 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Must be a valid email address').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must be at most 30 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
});

export const loginSchema = z.object({
  loginIdentifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Query parameters validation schemas
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Export all schemas
export const schemas = {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  createUserSchema,
  updateUserSchema,
  loginSchema,
  paginationQuerySchema,
};