/**
 * Signature Routes
 * /signatures - Visual and digital signature management
 */

import { Router, Response } from 'express';
import multer from 'multer';
import { SignatureCore } from '../../core/signature';
import { AuditCore, AuditAction } from '../../core/audit';
import { AuthRequest } from '../middleware/auth.middleware';

// Configure multer for signature image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for signatures
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPEG images are allowed for signatures'));
    }
  },
});

export const createSignatureRoutes = (
  signatureCore: SignatureCore,
  auditCore: AuditCore
): Router => {
  const router = Router();

  /**
   * POST /signatures/visual
   * Upload visual signature image
   */
  router.post(
    '/visual',
    upload.single('signature'),
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
              message: 'No signature image uploaded',
            },
          });
        }

        const fileUrl = await signatureCore.saveVisualSignature(
          req.user.userId,
          req.file.buffer,
          req.file.mimetype
        );

        // Log to audit trail
        await auditCore.logAction(
          req.user.userId,
          AuditAction.SIGNATURE_CAPTURED,
          {
            type: 'visual',
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
          }
        );

        res.status(201).json({
          success: true,
          data: {
            userId: req.user.userId,
            signatureUrl: fileUrl,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: {
            code: 'SIGNATURE_UPLOAD_FAILED',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * GET /signatures/visual/:userId
   * Get visual signature URL for a user
   */
  router.get('/visual/:userId', async (req: AuthRequest, res: Response) => {
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

      const signatureUrl = await signatureCore.getVisualSignatureUrl(req.params.userId);

      if (!signatureUrl) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SIGNATURE_NOT_FOUND',
            message: 'Visual signature not found for this user',
          },
        });
      }

      res.json({
        success: true,
        data: {
          userId: req.params.userId,
          signatureUrl,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SIGNATURE_FETCH_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /signatures/digital
   * Create digital signature for data
   */
  router.post('/digital', async (req: AuthRequest, res: Response) => {
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

      const { requestId, data, metadata } = req.body;

      if (!requestId || !data) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'requestId and data are required',
          },
        });
      }

      const signature = await signatureCore.createDigitalSignature({
        userId: req.user.userId,
        requestId,
        data,
        metadata: metadata || {
          deviceInfo: req.headers['user-agent'] || 'Unknown',
          ipAddress: req.ip || 'Unknown',
          location: null,
          biometricUsed: false,
        },
      });

      res.status(201).json({
        success: true,
        data: signature,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DIGITAL_SIGNATURE_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /signatures/verify/:signatureId
   * Verify digital signature
   */
  router.post('/verify/:signatureId', async (req: AuthRequest, res: Response) => {
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

      const { data } = req.body;

      if (!data) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATA',
            message: 'data is required for verification',
          },
        });
      }

      const result = await signatureCore.verifyDigitalSignature(
        req.params.signatureId,
        data
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /signatures/request/:requestId
   * Get all digital signatures for a request
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

      const signatures = await signatureCore.getDigitalSignaturesByRequest(
        req.params.requestId
      );

      res.json({
        success: true,
        data: signatures,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SIGNATURES_FETCH_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
};
