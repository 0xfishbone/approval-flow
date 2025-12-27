/**
 * Authentication Routes
 * /auth/login, /auth/register, /auth/refresh
 */

import { Router, Request, Response } from 'express';
import { UserCore } from '../../core/user';
import { validate, loginSchema, registerSchema, refreshTokenSchema, rateLimiter } from '../middleware';

export const createAuthRoutes = (userCore: UserCore): Router => {
  const router = Router();

  // Rate limit auth routes more strictly
  const authRateLimit = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  });

  /**
   * POST /auth/register
   * Register a new user
   */
  router.post(
    '/register',
    validate(registerSchema),
    async (req: Request, res: Response) => {
      try {
        const user = await userCore.createUser(req.body);

        res.status(201).json({
          success: true,
          data: user,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * POST /auth/login
   * Authenticate user and get tokens
   */
  router.post(
    '/login',
    authRateLimit,
    validate(loginSchema),
    async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        const authToken = await userCore.authenticateUser(email, password);

        res.json({
          success: true,
          data: authToken,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  router.post(
    '/refresh',
    validate(refreshTokenSchema),
    async (req: Request, res: Response) => {
      try {
        const { refreshToken } = req.body;
        const authToken = await userCore.refreshAccessToken(refreshToken);

        res.json({
          success: true,
          data: authToken,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_FAILED',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  return router;
};
