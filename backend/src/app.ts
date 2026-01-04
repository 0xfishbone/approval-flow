/**
 * Express Application Setup
 * API Gateway - Routes all requests to appropriate modules
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, notFoundHandler, rateLimiter, authMiddleware } from './api/middleware';
import { createAuthRoutes } from './api/routes/auth.routes';
import { createRequestRoutes } from './api/routes/request.routes';
import { createWorkflowRoutes } from './api/routes/workflow.routes';
import { createSignatureRoutes } from './api/routes/signature.routes';
import { createNotificationRoutes } from './api/routes/notification.routes';
import { createDocumentRoutes } from './api/routes/document.routes';
import { UserCore } from './core/user';
import { RequestCore } from './core/request';
import { WorkflowCore } from './core/workflow';
import { SignatureCore } from './core/signature';
import { AuditCore } from './core/audit';
import { NotificationCore } from './core/notification';
import { CommentCore } from './core/comment';
import { DocumentCore } from './core/document';
import { DatabaseWrapper, EmailWrapper, StorageWrapper, PushWrapper } from './platform';

export interface AppConfig {
  port: number;
  corsOrigin: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  databaseUrl: string;
  emailConfig: {
    apiKey: string;
    fromEmail: string;
    webhookSecret: string;
  };
  storageConfig: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    endpoint?: string;
  };
  firebaseConfig: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };
}

export class App {
  public app: Express;
  private config: AppConfig;

  // Core modules
  private db: DatabaseWrapper;
  private email: EmailWrapper;
  private storage: StorageWrapper;
  private push: PushWrapper;
  private userCore: UserCore;
  private requestCore: RequestCore;
  private workflowCore: WorkflowCore;
  private signatureCore: SignatureCore;
  private auditCore: AuditCore;
  private notificationCore: NotificationCore;
  private commentCore: CommentCore;
  private documentCore: DocumentCore;

  constructor(config: AppConfig) {
    this.config = config;
    this.app = express();

    // Initialize platform wrappers
    this.db = new DatabaseWrapper(config.databaseUrl);
    this.email = new EmailWrapper(config.emailConfig);
    this.storage = new StorageWrapper(config.storageConfig);
    this.push = new PushWrapper(config.firebaseConfig);

    // Initialize core modules
    this.userCore = new UserCore(this.db, {
      jwtSecret: config.jwtSecret,
      jwtRefreshSecret: config.jwtRefreshSecret,
    });
    this.requestCore = new RequestCore(this.db);
    this.workflowCore = new WorkflowCore(this.db);
    this.signatureCore = new SignatureCore(this.db, this.storage);
    this.auditCore = new AuditCore(this.db);
    this.notificationCore = new NotificationCore(this.db, this.email, this.push);
    this.commentCore = new CommentCore(this.db);
    this.documentCore = new DocumentCore(this.db, this.storage);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    // Security
    this.app.use(helmet());

    // CORS - Support multiple origins (comma-separated in env)
    const allowedOrigins = this.config.corsOrigin.split(',').map(o => o.trim());
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list or matches Vercel preview pattern
        if (allowedOrigins.some(allowed =>
          origin === allowed ||
          origin.match(/https:\/\/approval-flow.*\.vercel\.app/)
        )) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }));

    // Global rate limiting
    this.app.use(rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging in development
    if (process.env.NODE_ENV === 'development') {
      this.app.use((req, _res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    });

    // API routes
    this.app.use('/api/auth', createAuthRoutes(this.userCore));

    // Protected routes (require authentication)
    const authMw = authMiddleware(this.config.jwtSecret);
    this.app.use(
      '/api/requests',
      authMw,
      createRequestRoutes(this.requestCore, this.userCore, this.workflowCore, this.commentCore, this.storage, this.notificationCore)
    );
    this.app.use(
      '/api/workflows',
      authMw,
      createWorkflowRoutes(this.workflowCore, this.requestCore, this.userCore, this.notificationCore)
    );
    this.app.use(
      '/api/signatures',
      authMw,
      createSignatureRoutes(this.signatureCore, this.auditCore)
    );
    this.app.use(
      '/api/notifications',
      authMw,
      createNotificationRoutes(this.notificationCore, this.userCore)
    );
    this.app.use(
      '/api/documents',
      authMw,
      createDocumentRoutes(this.documentCore, this.requestCore, this.userCore)
    );
  }

  private setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler (must be last)
    this.app.use(errorHandler);
  }

  public listen() {
    return this.app.listen(this.config.port, () => {
      console.log(`🚀 ApprovalFlow API running on port ${this.config.port}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${this.config.port}/health`);
    });
  }

  public async close() {
    await this.db.close();
    console.log('Database connection closed');
  }

  // Expose core modules for testing
  public getCoreModules() {
    return {
      userCore: this.userCore,
      requestCore: this.requestCore,
      workflowCore: this.workflowCore,
      signatureCore: this.signatureCore,
      auditCore: this.auditCore,
      notificationCore: this.notificationCore,
      commentCore: this.commentCore,
      documentCore: this.documentCore,
      db: this.db,
      email: this.email,
      storage: this.storage,
      push: this.push,
    };
  }
}
