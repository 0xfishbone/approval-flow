/**
 * Rate Limiting Middleware
 * Prevents abuse and brute force attacks
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export const rateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
}) => {
  const store: RateLimitStore = {};

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    // Clean up old entries
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > options.maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);

      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter,
        },
      });
    }

    next();
  };
};
