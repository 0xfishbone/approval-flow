/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user info to request
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../shared/types';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    companyId: string;
  };
}

export const authMiddleware = (jwtSecret: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided',
          },
        });
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, jwtSecret) as {
          userId: string;
          role: UserRole;
          companyId: string;
        };

        req.user = decoded;
        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        });
      }
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};
