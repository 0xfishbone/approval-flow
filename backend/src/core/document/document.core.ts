/**
 * DocumentCore - Document and PDF management
 * ~150 lines (simplified - full PDF generation would be ~220 lines)
 * Dependencies: DatabaseWrapper, StorageWrapper
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseWrapper, StorageWrapper } from '../../platform';
import {
  DocumentCoreInterface,
  Document,
  DocumentInput,
  PDFGenerationOptions,
} from './document.types';

export class DocumentCore implements DocumentCoreInterface {
  private db: DatabaseWrapper;
  private storage: StorageWrapper;

  constructor(db: DatabaseWrapper, storage: StorageWrapper) {
    this.db = db;
    this.storage = storage;
  }

  /**
   * Create document record
   */
  async createDocument(input: DocumentInput): Promise<Document> {
    const document = await this.db.insert<any>('documents', {
      id: uuidv4(),
      request_id: input.requestId,
      document_type: 'PDF',
      file_name: input.fileName,
      file_url: input.fileUrl,
      file_size: input.fileSize,
      generated_by: input.generatedBy || null,
    });

    return this.mapRowToDocument(document);
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    const row = await this.db.queryOne<any>('SELECT * FROM documents WHERE id = $1', [id]);

    return row ? this.mapRowToDocument(row) : null;
  }

  /**
   * Get all documents for a request
   */
  async getDocumentsByRequest(requestId: string): Promise<Document[]> {
    const rows = await this.db.query<any>(
      'SELECT * FROM documents WHERE request_id = $1 ORDER BY created_at DESC',
      [requestId]
    );

    return rows.map(this.mapRowToDocument);
  }

  /**
   * Generate PDF for request
   * NOTE: This is a simplified version that creates a placeholder
   * Production would use PDFKit, Puppeteer, or similar library
   */
  async generatePDF(options: PDFGenerationOptions): Promise<Document> {
    // Get request data
    const request = await this.db.queryOne<any>(
      `SELECT r.*, u.first_name, u.last_name, d.name as department_name
       FROM requests r
       JOIN users u ON r.creator_id = u.id
       JOIN departments d ON r.department_id = d.id
       WHERE r.id = $1`,
      [options.requestId]
    );

    if (!request) {
      throw new Error('Request not found');
    }

    // Get approval history
    const approvals = await this.db.query<any>(
      `SELECT a.*, u.first_name, u.last_name, u.role
       FROM approvals a
       JOIN users u ON a.approver_id = u.id
       WHERE a.request_id = $1
       ORDER BY a.step_order ASC`,
      [options.requestId]
    );

    // Generate PDF content (simplified - would use PDF library)
    const pdfContent = this.generatePDFContent(request, approvals);
    const pdfBuffer = Buffer.from(pdfContent, 'utf-8');

    // Upload to storage
    const fileName = `${request.request_number}.pdf`;
    const key = `documents/pdfs/${options.requestId}/${fileName}`;
    const fileUrl = await this.storage.uploadFile(key, pdfBuffer, 'application/pdf');

    // Create document record
    return this.createDocument({
      requestId: options.requestId,
      fileName,
      fileUrl,
      fileSize: pdfBuffer.length,
      generatedBy: 'system',
    });
  }

  /**
   * Generate PDF content
   * In production, this would use a PDF library like PDFKit
   */
  private generatePDFContent(request: any, approvals: any[]): string {
    // This is a placeholder - in production would generate actual PDF
    const content = `
APPROVAL REQUEST
================

Request Number: ${request.request_number}
Date: ${new Date(request.created_at).toLocaleDateString()}
Department: ${request.department_name}
Submitted by: ${request.first_name} ${request.last_name}

ITEMS REQUESTED:
${JSON.parse(request.items)
  .map((item: any, i: number) => `${i + 1}. ${item.description} - ${item.quantity} ${item.unit || ''}`)
  .join('\n')}

${request.notes ? `NOTES:\n${request.notes}\n` : ''}

APPROVAL HISTORY:
${approvals
  .map(
    (a) =>
      `- ${a.role}: ${a.status} by ${a.first_name} ${a.last_name} on ${new Date(a.timestamp).toLocaleDateString()}`
  )
  .join('\n')}

Status: ${request.status}
Generated: ${new Date().toISOString()}

---
This is a computer-generated document.
    `;

    return content.trim();
  }

  /**
   * Map database row to Document object
   */
  private mapRowToDocument(row: any): Document {
    return {
      id: row.id,
      requestId: row.request_id,
      documentType: row.document_type,
      fileName: row.file_name,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      generatedBy: row.generated_by,
      createdAt: new Date(row.created_at),
    };
  }
}
