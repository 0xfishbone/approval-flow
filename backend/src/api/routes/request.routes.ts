/**
 * Request Routes
 * /requests - CRUD operations for approval requests
 */

import { Router, Response } from 'express';
import multer from 'multer';
import { RequestCore } from '../../core/request';
import { UserCore } from '../../core/user';
import { WorkflowCore } from '../../core/workflow';
import { CommentCore } from '../../core/comment';
import { NotificationCore } from '../../core/notification';
import { StorageWrapper } from '../../platform';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  validate,
  createRequestSchema,
} from '../middleware/validation.middleware';
import { UserRole, Action, WorkflowStep } from '../../shared/types';

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export const createRequestRoutes = (
  requestCore: RequestCore,
  userCore: UserCore,
  workflowCore: WorkflowCore,
  commentCore: CommentCore,
  storageWrapper: StorageWrapper,
  notificationCore: NotificationCore
): Router => {
  const router = Router();

  /**
   * POST /requests
   * Create a new request
   * Permission: Staff and Manager only
   */
  router.post(
    '/',
    validate(createRequestSchema),
    async (req: AuthRequest, res: Response) => {
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

        // Verify user can create requests
        const canCreate = await userCore.validatePermission(
          req.user.userId,
          Action.CREATE_REQUEST
        );

        if (!canCreate) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only Staff and Managers can create requests',
            },
          });
        }

        const request = await requestCore.createRequest(req.user.userId, req.body);

        // Auto-create workflow for the request
        const user = await userCore.getUserById(req.user.userId);
        if (user) {
          const workflow = await workflowCore.createWorkflow(request.id, request.companyId, user.role);

          // Send notification to first approver
          const firstApprover = await workflowCore.getCurrentApprover(workflow.id);
          if (firstApprover) {
            const companyUsers = await userCore.getUsersByCompany(request.companyId);
            const firstApproverUser = companyUsers.find(
              (u) => u.role === firstApprover.role
            );
            if (firstApproverUser) {
              await notificationCore.notifyApprovalNeeded(
                request.id,
                firstApproverUser.id,
                {
                  requestNumber: request.requestNumber,
                  items: request.items,
                  submitter: `${user.firstName} ${user.lastName}`,
                }
              );
            }
          }
        }

        res.status(201).json({
          success: true,
          data: request,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'REQUEST_CREATION_FAILED',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * GET /requests
   * Get requests based on user role
   * - Staff: Own requests only
   * - Manager: All department requests
   * - Contrôleur/Direction/Économe: All company requests at current step
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

      const user = await userCore.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      let requests: any[];

      switch (user.role) {
        case UserRole.STAFF:
          // Staff see only their own requests
          requests = await requestCore.getRequestsByCreator(user.id);
          break;

        case UserRole.MANAGER:
          // Manager sees all department requests
          if (!user.departmentId) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'NO_DEPARTMENT',
                message: 'Manager must be assigned to a department',
              },
            });
          }
          requests = await requestCore.getRequestsByDepartment(user.departmentId);
          break;

        case UserRole.CONTROLEUR:
          // Contrôleur sees all company requests at CONTROLEUR step
          requests = await requestCore.getPendingRequestsForApprover(
            user.companyId,
            WorkflowStep.CONTROLEUR
          );
          break;

        case UserRole.DIRECTION:
          // Direction sees all company requests at DIRECTION step
          requests = await requestCore.getPendingRequestsForApprover(
            user.companyId,
            WorkflowStep.DIRECTION
          );
          break;

        case UserRole.ECONOME:
          // Économe sees all company requests at ECONOME step
          requests = await requestCore.getPendingRequestsForApprover(
            user.companyId,
            WorkflowStep.ECONOME
          );
          break;

        default:
          requests = [];
      }

      res.json({
        success: true,
        data: requests,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'REQUEST_FETCH_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /requests/:id
   * Get single request by ID
   * Permission: Must have VIEW_REQUEST permission
   */
  router.get('/:id', async (req: AuthRequest, res: Response) => {
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

      const canView = await userCore.validatePermission(
        req.user.userId,
        Action.VIEW_REQUEST
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to view request',
          },
        });
      }

      const request = await requestCore.getRequestById(req.params.id);

      if (!request) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Request not found',
          },
        });
      }

      // Additional authorization: Staff can only see their own requests
      const user = await userCore.getUserById(req.user.userId);
      if (user?.role === UserRole.STAFF && request.creatorId !== user.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own requests',
          },
        });
      }

      // Get creator details with department name
      const creator = await userCore.getUserById(request.creatorId);

      let departmentName: string | undefined;
      if (creator?.departmentId) {
        try {
          const department = await requestCore['db'].queryOne<any>(
            'SELECT name FROM departments WHERE id = $1',
            [creator.departmentId]
          );
          departmentName = department?.name;
        } catch (error) {
          console.error('Failed to fetch department name:', error);
        }
      }

      res.json({
        success: true,
        data: {
          ...request,
          creator: creator ? {
            id: creator.id,
            firstName: creator.firstName,
            lastName: creator.lastName,
            email: creator.email,
            role: creator.role,
            departmentId: creator.departmentId,
            departmentName,
          } : null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'REQUEST_FETCH_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /requests/:id/attachments
   * Upload attachment to request
   * Permission: Must be request creator or approver
   */
  router.post(
    '/:id/attachments',
    upload.single('file'),
    async (req: AuthRequest, res: Response) => {
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

        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'NO_FILE',
              message: 'No file uploaded',
            },
          });
        }

        const request = await requestCore.getRequestById(req.params.id);

        if (!request) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'REQUEST_NOT_FOUND',
              message: 'Request not found',
            },
          });
        }

        // Verify user is creator or has view permission
        const user = await userCore.getUserById(req.user.userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }

        // Upload file to storage
        const fileKey = `attachments/${request.id}/${Date.now()}-${req.file.originalname}`;
        const fileUrl = await storageWrapper.uploadFile(
          fileKey,
          req.file.buffer,
          req.file.mimetype
        );

        // Create attachment record
        const attachment = await requestCore.addAttachment(
          req.params.id,
          req.user.userId,
          {
            fileName: req.file.originalname,
            fileUrl,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
          }
        );

        res.status(201).json({
          success: true,
          data: attachment,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'ATTACHMENT_UPLOAD_FAILED',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * GET /requests/:id/comments
   * Get all comments for a request with user details
   * Permission: Must have VIEW_REQUEST permission
   */
  router.get('/:id/comments', async (req: AuthRequest, res: Response) => {
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

      const canView = await userCore.validatePermission(
        req.user.userId,
        Action.VIEW_REQUEST
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to view comments',
          },
        });
      }

      // Verify request exists
      const request = await requestCore.getRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Request not found',
          },
        });
      }

      // Get comments
      const comments = await commentCore.getComments(req.params.id);

      // Enrich with user details
      const enrichedComments = await Promise.all(
        comments.map(async (comment) => {
          const user = await userCore.getUserById(comment.userId);
          return {
            ...comment,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              departmentId: user.departmentId,
              createdAt: user.createdAt,
            } : null,
          };
        })
      );

      res.json({
        success: true,
        data: enrichedComments,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'COMMENTS_FETCH_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /requests/:id/comments
   * Add a comment to a request
   * Permission: Must have VIEW_REQUEST permission
   */
  router.post('/:id/comments', async (req: AuthRequest, res: Response) => {
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

      const canView = await userCore.validatePermission(
        req.user.userId,
        Action.VIEW_REQUEST
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to add comment',
          },
        });
      }

      // Verify request exists
      const request = await requestCore.getRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Request not found',
          },
        });
      }

      const { content } = req.body;
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONTENT',
            message: 'Comment content is required',
          },
        });
      }

      // Add comment
      const comment = await commentCore.addComment({
        requestId: req.params.id,
        userId: req.user.userId,
        content: content.trim(),
        viaEmail: false,
      });

      // Get user details for response
      const user = await userCore.getUserById(req.user.userId);

      res.status(201).json({
        success: true,
        data: {
          ...comment,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
            createdAt: user.createdAt,
          } : null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'COMMENT_CREATION_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
};
