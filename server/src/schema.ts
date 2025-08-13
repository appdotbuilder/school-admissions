import { z } from 'zod';

// User role enum schema
export const userRoleSchema = z.enum(['pendaftar', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Public user schema (without password hash)
export const publicUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PublicUser = z.infer<typeof publicUserSchema>;

// User registration input schema
export const registerUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema.default('pendaftar') // Default to 'pendaftar' role
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// User login input schema
export const loginUserInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Authentication response schema
export const authResponseSchema = z.object({
  success: z.boolean(),
  user: publicUserSchema.nullable(),
  message: z.string().optional()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// User profile update input schema
export const updateUserProfileInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

// Get user by ID input schema
export const getUserByIdInputSchema = z.object({
  id: z.number()
});

export type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>;