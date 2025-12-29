/**
 * Vercel Serverless Function Entry Point
 * Wraps the Express app to run in Vercel's serverless environment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { App, AppConfig } from '../backend/src/app';

// Initialize Express app once (cached across function invocations)
let app: App | null = null;
let initError: Error | null = null;

function getApp() {
  // Return cached error if initialization failed previously
  if (initError) {
    throw initError;
  }

  // Return cached app if already initialized
  if (app) {
    return app;
  }

  try {
    // Validate required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SENDGRID_API_KEY',
      'SENDGRID_FROM_EMAIL',
    ];

    const missingVars: string[] = [];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      const error = new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n\n` +
        `Please add these in Vercel Dashboard → Settings → Environment Variables`
      );
      initError = error;
      throw error;
    }

    // Build configuration from environment
    const config: AppConfig = {
      port: parseInt(process.env.PORT || '3000', 10),
      corsOrigin: process.env.CORS_ORIGIN || '*',
      jwtSecret: process.env.JWT_SECRET!,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
      databaseUrl: process.env.DATABASE_URL!,
      emailConfig: {
        apiKey: process.env.SENDGRID_API_KEY!,
        fromEmail: process.env.SENDGRID_FROM_EMAIL!,
        webhookSecret: process.env.SENDGRID_INBOUND_WEBHOOK_SECRET || '',
      },
      storageConfig: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET || 'approvalflow-production',
        endpoint: process.env.AWS_ENDPOINT,
      },
      firebaseConfig: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      },
    };

    console.log('[Serverless] Initializing Express app...');
    app = new App(config);
    console.log('[Serverless] Express app initialized successfully');

    return app;
  } catch (error) {
    console.error('[Serverless] Initialization error:', error);
    initError = error instanceof Error ? error : new Error(String(error));
    throw initError;
  }
}

// Export handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const appInstance = getApp();
    return appInstance.app(req, res);
  } catch (error) {
    console.error('[Serverless] Request handler error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVERLESS_FUNCTION_ERROR',
        message: errorMessage,
        ...(isDevelopment && {
          stack: error instanceof Error ? error.stack : undefined,
          details: 'Check Vercel function logs for more information',
        }),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
