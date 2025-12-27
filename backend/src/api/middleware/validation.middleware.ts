/**
 * Validation Middleware
 * Validates request bodies using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['STAFF', 'MANAGER', 'CONTROLEUR', 'DIRECTION', 'ECONOME']),
  companyId: z.string().uuid('Invalid company ID'),
  departmentId: z.string().uuid('Invalid department ID').optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Request validation schemas
export const createRequestSchema = z.object({
  departmentId: z.string().uuid('Invalid department ID'),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Item description is required'),
      quantity: z.number().positive('Quantity must be positive'),
      unit: z.string().optional(),
    })
  ).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

export const uploadAttachmentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
});

// Workflow validation schemas
export const approveStepSchema = z.object({
  digitalSignature: z.string().min(1, 'Digital signature is required'),
  additionalData: z
    .object({
      dailyCost: z.number().positive().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  location: z.string().optional(),
});

export const rejectStepSchema = z.object({
  digitalSignature: z.string().min(1, 'Digital signature is required'),
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  location: z.string().optional(),
});
