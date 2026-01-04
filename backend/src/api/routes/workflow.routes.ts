/**
 * Workflow Routes
 * /workflows - Approval routing and workflow management
 */

import { Router, Response } from 'express';
import { WorkflowCore } from '../../core/workflow';
import { RequestCore } from '../../core/request';
import { UserCore } from '../../core/user';
import { NotificationCore } from '../../core/notification';
import { AuthRequest } from '../middleware/auth.middleware';
import { validate, approveStepSchema, rejectStepSchema } from '../middleware';
import { Action } from '../../shared/types';

export const createWorkflowRoutes = (
  workflowCore: WorkflowCore,
  requestCore: RequestCore,
  userCore: UserCore,
  notificationCore: NotificationCore
): Router => {
  const router = Router();

  /**
   * POST /workflows/:requestId/create
   * Create workflow for a request
   * This is typically called automatically when a request is created
   */
  router.post('/:requestId/create', async (req: AuthRequest, res: Response) => {
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

      const request = await requestCore.getRequestById(req.params.requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Request not found',
          },
        });
      }

      // Verify user is the creator
      if (request.creatorId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only request creator can initiate workflow',
          },
        });
      }

      // Get creator info
      const creator = await userCore.getUserById(req.user.userId);
      if (!creator) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Creator not found',
          },
        });
      }

      const workflow = await workflowCore.createWorkflow(
        req.params.requestId,
        request.companyId,
        creator.role
      );

      res.status(201).json({
        success: true,
        data: workflow,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'WORKFLOW_CREATION_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /workflows/:requestId/approve
   * Approve current workflow step
   */
  router.post(
    '/:requestId/approve',
    validate(approveStepSchema),
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

        // Verify user can approve
        const canApprove = await userCore.validatePermission(
          req.user.userId,
          Action.APPROVE_REQUEST
        );

        if (!canApprove) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions to approve',
            },
          });
        }

        // Get workflow
        const workflow = await workflowCore.getWorkflowByRequestId(req.params.requestId);
        if (!workflow) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'WORKFLOW_NOT_FOUND',
              message: 'Workflow not found for this request',
            },
          });
        }

        if (workflow.isComplete) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'WORKFLOW_COMPLETE',
              message: 'Workflow is already complete',
            },
          });
        }

        const { digitalSignature, additionalData, location } = req.body;

        const approval = await workflowCore.approveStep(
          workflow.id,
          req.user.userId,
          digitalSignature,
          additionalData,
          location
        );

        // Update request status and send notifications
        const request = await requestCore.getRequestById(req.params.requestId);
        if (request) {
          const updatedWorkflow = await workflowCore.getWorkflowByRequestId(req.params.requestId);

          if (updatedWorkflow?.isComplete) {
            // Workflow complete - update status and notify submitter
            await requestCore['db'].update('requests', req.params.requestId, {
              status: 'APPROVED',
            });

            await notificationCore.notifyApprovalComplete(
              req.params.requestId,
              request.creatorId,
              {
                requestNumber: request.requestNumber,
                submitter: `${request.creatorId}`,
              }
            );
          } else if (updatedWorkflow) {
            // Set status to IN_PROGRESS on first approval
            if (request.status === 'PENDING') {
              await requestCore['db'].update('requests', req.params.requestId, {
                status: 'IN_PROGRESS',
              });
            }

            // Get next approver and notify them
            const nextApproverStep = await workflowCore.getCurrentApprover(updatedWorkflow.id);
            if (nextApproverStep) {
              // Find a user with this role in the company to notify
              const companyUsers = await userCore.getUsersByCompany(request.companyId);
              const nextApproverUser = companyUsers.find(
                (u) => u.role === nextApproverStep.role
              );
              if (nextApproverUser) {
                await notificationCore.notifyApprovalNeeded(
                  req.params.requestId,
                  nextApproverUser.id,
                  {
                    requestNumber: request.requestNumber,
                    items: request.items,
                    submitter: `${request.creatorId}`,
                  }
                );
              }
            }
          }
        }

        res.json({
          success: true,
          data: approval,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'APPROVAL_FAILED',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * POST /workflows/:requestId/reject
   * Reject current workflow step
   */
  router.post(
    '/:requestId/reject',
    validate(rejectStepSchema),
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

        // Verify user can reject
        const canReject = await userCore.validatePermission(
          req.user.userId,
          Action.REJECT_REQUEST
        );

        if (!canReject) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions to reject',
            },
          });
        }

        // Get workflow
        const workflow = await workflowCore.getWorkflowByRequestId(req.params.requestId);
        if (!workflow) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'WORKFLOW_NOT_FOUND',
              message: 'Workflow not found for this request',
            },
          });
        }

        if (workflow.isComplete) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'WORKFLOW_COMPLETE',
              message: 'Workflow is already complete',
            },
          });
        }

        const { digitalSignature, rejectionReason, location } = req.body;

        const approval = await workflowCore.rejectStep(
          workflow.id,
          req.user.userId,
          digitalSignature,
          rejectionReason,
          location
        );

        // Update request status to REJECTED and send notification
        const request = await requestCore.getRequestById(req.params.requestId);
        if (request) {
          await requestCore['db'].update('requests', req.params.requestId, {
            status: 'REJECTED',
          });

          await notificationCore.notifyRejection(
            req.params.requestId,
            request.creatorId,
            rejectionReason,
            {
              requestNumber: request.requestNumber,
            }
          );
        }

        res.json({
          success: true,
          data: approval,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: {
            code: 'REJECTION_FAILED',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * GET /workflows/:requestId
   * Get workflow status for a request
   */
  router.get('/:requestId', async (req: AuthRequest, res: Response) => {
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

      const workflow = await workflowCore.getWorkflowByRequestId(req.params.requestId);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: 'Workflow not found',
          },
        });
      }

      // Get approval history
      const approvals = await workflowCore.getApprovalHistory(req.params.requestId);

      // Get current approver if not complete
      let currentApprover = null;
      if (!workflow.isComplete) {
        currentApprover = await workflowCore.getCurrentApprover(workflow.id);
      }

      res.json({
        success: true,
        data: {
          workflow,
          approvals,
          currentApprover,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'WORKFLOW_FETCH_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
};
