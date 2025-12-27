/**
 * AuditCore - Immutable append-only audit logging
 * ~150 lines
 * Dependencies: DatabaseWrapper only
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { DatabaseWrapper } from '../../platform';
import {
  AuditCoreInterface,
  AuditAction,
  AuditEntry,
  AuditReport,
  IntegrityResult,
} from './audit.types';

export class AuditCore implements AuditCoreInterface {
  private db: DatabaseWrapper;

  constructor(db: DatabaseWrapper) {
    this.db = db;
  }

  /**
   * Log an action to audit trail
   * Generates checksum chain for integrity verification
   */
  async logAction(
    userId: string,
    action: AuditAction,
    metadata: Record<string, any>,
    requestId?: string
  ): Promise<AuditEntry> {
    // Get previous checksum for chaining
    const previousEntry = await this.db.queryOne<any>(
      requestId
        ? 'SELECT checksum FROM audit_logs WHERE request_id = $1 ORDER BY timestamp DESC LIMIT 1'
        : 'SELECT checksum FROM audit_logs ORDER BY timestamp DESC LIMIT 1',
      requestId ? [requestId] : []
    );

    const previousChecksum = previousEntry?.checksum || '0';

    // Generate current checksum
    const dataToHash = `${userId}:${action}:${JSON.stringify(metadata)}:${previousChecksum}`;
    const checksum = crypto.createHash('sha256').update(dataToHash).digest('hex');

    // Insert audit log entry
    const entry = await this.db.insert<any>('audit_logs', {
      id: uuidv4(),
      request_id: requestId || null,
      user_id: userId,
      action,
      metadata: JSON.stringify(metadata),
      checksum,
    });

    return this.mapRowToAuditEntry(entry);
  }

  /**
   * Get complete audit trail for a request
   */
  async getAuditTrail(requestId: string): Promise<AuditEntry[]> {
    const rows = await this.db.query<any>(
      'SELECT * FROM audit_logs WHERE request_id = $1 ORDER BY timestamp ASC',
      [requestId]
    );

    return rows.map(this.mapRowToAuditEntry);
  }

  /**
   * Get all audit entries by a specific user
   */
  async getAuditEntriesByUser(userId: string): Promise<AuditEntry[]> {
    const rows = await this.db.query<any>(
      'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );

    return rows.map(this.mapRowToAuditEntry);
  }

  /**
   * Get all audit entries for a specific action type
   */
  async getAuditEntriesByAction(action: AuditAction): Promise<AuditEntry[]> {
    const rows = await this.db.query<any>(
      'SELECT * FROM audit_logs WHERE action = $1 ORDER BY timestamp DESC',
      [action]
    );

    return rows.map(this.mapRowToAuditEntry);
  }

  /**
   * Verify integrity of audit logs
   * Checks checksum chain to detect tampering
   */
  async verifyIntegrity(requestId?: string): Promise<IntegrityResult> {
    const entries = requestId
      ? await this.getAuditTrail(requestId)
      : await this.db
          .query<any>('SELECT * FROM audit_logs ORDER BY timestamp ASC')
          .then((rows) => rows.map(this.mapRowToAuditEntry));

    const corruptedEntries: string[] = [];
    let lastVerifiedEntry: string | null = null;
    let previousChecksum = '0';

    for (const entry of entries) {
      // Recompute checksum
      const dataToHash = `${entry.userId}:${entry.action}:${JSON.stringify(entry.metadata)}:${previousChecksum}`;
      const expectedChecksum = crypto.createHash('sha256').update(dataToHash).digest('hex');

      if (expectedChecksum !== entry.checksum) {
        corruptedEntries.push(entry.id);
      } else {
        lastVerifiedEntry = entry.id;
      }

      previousChecksum = entry.checksum;
    }

    return {
      isValid: corruptedEntries.length === 0,
      corruptedEntries,
      lastVerifiedEntry,
    };
  }

  /**
   * Generate audit report for a request
   * Includes integrity verification
   */
  async generateAuditReport(requestId: string): Promise<AuditReport> {
    const entries = await this.getAuditTrail(requestId);
    const integrity = await this.verifyIntegrity(requestId);

    return {
      requestId,
      entries,
      integrityVerified: integrity.isValid,
      generatedAt: new Date(),
    };
  }

  /**
   * Helper: Create audit metadata for common actions
   */
  createMetadata(description: string, additionalData?: Record<string, any>): Record<string, any> {
    return {
      description,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };
  }

  /**
   * Map database row to AuditEntry object
   */
  private mapRowToAuditEntry(row: any): AuditEntry {
    let metadata: Record<string, any>;
    try {
      metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    } catch {
      metadata = {};
    }

    return {
      id: row.id,
      requestId: row.request_id,
      userId: row.user_id,
      action: row.action as AuditAction,
      metadata,
      checksum: row.checksum,
      timestamp: new Date(row.timestamp),
    };
  }
}
