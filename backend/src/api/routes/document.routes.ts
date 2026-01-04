/**
 * Document Routes
 * /documents - PDF generation and document management
 */

import { Router, Response } from 'express';
import { DocumentCore } from '../../core/document';
import { RequestCore } from '../../core/request';
import { UserCore } from '../../core/user';
import { AuthRequest } from '../middleware/auth.middleware';
import { Action } from '../../shared/types';

export const createDocumentRoutes = (
  documentCore: DocumentCore,
  requestCore: RequestCore,
  userCore: UserCore
): Router => {
  const router = Router();

  /**
   * POST /documents/generate-pdf
   * Generate PDF for a request
   * Body: { requestId: string, includeSignatures?: boolean }
   */
  router.post('/generate-pdf', async (req: AuthRequest, res: Response) => {
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

      const { requestId, includeSignatures = true } = req.body;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUEST_ID',
            message: 'Request ID is required',
          },
        });
      }

      // Verify request exists
      const request = await requestCore.getRequestById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Request not found',
          },
        });
      }

      // Verify user has permission to view this request
      const canView = await userCore.validatePermission(
        req.user.userId,
        Action.VIEW_REQUEST
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to generate PDF',
          },
        });
      }

      // Generate PDF
      const document = await documentCore.generatePDF({
        requestId,
        includeSignatures,
      });

      res.status(201).json({
        success: true,
        data: document,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PDF_GENERATION_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /documents/:id
   * Get document by ID
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

      const document = await documentCore.getDocument(req.params.id);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        });
      }

      // Verify user has permission to view the associated request
      const request = await requestCore.getRequestById(document.requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Associated request not found',
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
            message: 'Insufficient permissions to view document',
          },
        });
      }

      res.json({
        success: true,
        data: document,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DOCUMENT_FETCH_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /documents/request/:requestId
   * Get all documents for a request
   */
  router.get('/request/:requestId', async (req: AuthRequest, res: Response) => {
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

      // Verify request exists and user has permission
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

      const canView = await userCore.validatePermission(
        req.user.userId,
        Action.VIEW_REQUEST
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to view documents',
          },
        });
      }

      const documents = await documentCore.getDocumentsByRequest(req.params.requestId);

      res.json({
        success: true,
        data: documents,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DOCUMENTS_FETCH_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
};
