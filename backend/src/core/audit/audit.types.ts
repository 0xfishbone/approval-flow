/**
 * Audit Types
 * Immutable append-only audit logging
 */

export enum AuditAction {
  REQUEST_CREATED = 'REQUEST_CREATED',
  REQUEST_APPROVED = 'REQUEST_APPROVED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ATTACHMENT_UPLOADED = 'ATTACHMENT_UPLOADED',
  SIGNATURE_CAPTURED = 'SIGNATURE_CAPTURED',
  PDF_GENERATED = 'PDF_GENERATED',
  USER_LOGIN = 'USER_LOGIN',
  USER_CREATED = 'USER_CREATED',
  WORKFLOW_CREATED = 'WORKFLOW_CREATED',
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED',
}

export interface AuditEntry {
  id: string;
  requestId: string | null;
  userId: string;
  action: AuditAction;
  metadata: Record<string, any>;
  checksum: string;
  timestamp: Date;
}

export interface AuditReport {
  requestId: string;
  entries: AuditEntry[];
  integrityVerified: boolean;
  generatedAt: Date;
}

export interface IntegrityResult {
  isValid: boolean;
  corruptedEntries: string[];
  lastVerifiedEntry: string | null;
}

export interface AuditCoreInterface {
  // Logging operations
  logAction(
    userId: string,
    action: AuditAction,
    metadata: Record<string, any>,
    requestId?: string
  ): Promise<AuditEntry>;

  // Query operations
  getAuditTrail(requestId: string): Promise<AuditEntry[]>;
  getAuditEntriesByUser(userId: string): Promise<AuditEntry[]>;
  getAuditEntriesByAction(action: AuditAction): Promise<AuditEntry[]>;

  // Integrity verification
  verifyIntegrity(requestId?: string): Promise<IntegrityResult>;
  generateAuditReport(requestId: string): Promise<AuditReport>;
}
