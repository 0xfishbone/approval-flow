/**
 * Notification Routes
 * /notifications - In-app notifications and device registration
 */

import { Router, Response } from 'express';
import { NotificationCore } from '../../core/notification';
import { UserCore } from '../../core/user';
import { AuthRequest } from '../middleware/auth.middleware';

export const createNotificationRoutes = (
  notificationCore: NotificationCore,
  _userCore: UserCore
): Router => {
  const router = Router();

  /**
   * GET /notifications
   * Get current user's notifications
   * Query params:
   *   - unreadOnly: boolean (optional) - only return unread notifications
   */
  router.get('/', async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const unreadOnly = req.query.unreadOnly === 'true';
      const notifications = await notificationCore.getUserNotifications(
        req.user.userId,
        unreadOnly
      );

      res.json({
        success: true,
        data: notifications,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'NOTIFICATIONS_FETCH_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * PATCH /notifications/:id/read
   * Mark a notification as read
   */
  router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // Verify notification belongs to user
      const notifications = await notificationCore.getUserNotifications(req.user.userId);
      const notification = notifications.find(n => n.id === req.params.id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found or does not belong to you',
          },
        });
      }

      await notificationCore.markAsRead(req.params.id);

      res.json({
        success: true,
        message: 'Notification marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'MARK_READ_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * PATCH /notifications/read-all
   * Mark all user's notifications as read
   */
  router.patch('/read-all', async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const notifications = await notificationCore.getUserNotifications(
        req.user.userId,
        true // unread only
      );

      await Promise.all(
        notifications.map(notification => notificationCore.markAsRead(notification.id))
      );

      res.json({
        success: true,
        message: `Marked ${notifications.length} notifications as read`,
        count: notifications.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'MARK_ALL_READ_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /notifications/devices
   * Register a device for push notifications
   */
  router.post('/devices', async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { deviceToken } = req.body;

      if (!deviceToken || typeof deviceToken !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DEVICE_TOKEN',
            message: 'Device token is required',
          },
        });
      }

      await notificationCore.registerDevice(req.user.userId, deviceToken);

      res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DEVICE_REGISTRATION_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /notifications/unread-count
   * Get count of unread notifications
   */
  router.get('/unread-count', async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const notifications = await notificationCore.getUserNotifications(
        req.user.userId,
        true // unread only
      );

      res.json({
        success: true,
        data: {
          count: notifications.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'UNREAD_COUNT_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
};
