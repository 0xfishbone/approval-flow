/**
 * CommentCore - Comments and email reply handling
 * ~180 lines
 * Dependencies: DatabaseWrapper, EmailWrapper (for parsing)
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseWrapper } from '../../platform';
import {
  CommentCoreInterface,
  Comment,
  CommentInput,
  InboundEmail,
  ParsedComment,
} from './comment.types';

export class CommentCore implements CommentCoreInterface {
  private db: DatabaseWrapper;

  constructor(db: DatabaseWrapper) {
    this.db = db;
  }

  /**
   * Add comment to request
   */
  async addComment(input: CommentInput): Promise<Comment> {
    const comment = await this.db.insert<any>('comments', {
      id: uuidv4(),
      request_id: input.requestId,
      user_id: input.userId,
      content: input.content,
      via_email: input.viaEmail || false,
    });

    return this.mapRowToComment(comment);
  }

  /**
   * Get all comments for a request (chronological order)
   */
  async getComments(requestId: string): Promise<Comment[]> {
    const rows = await this.db.query<any>(
      'SELECT * FROM comments WHERE request_id = $1 ORDER BY created_at ASC',
      [requestId]
    );

    return rows.map(this.mapRowToComment);
  }

  /**
   * Parse inbound email to extract comment
   * Looks for request ID in subject line or body
   */
  async parseInboundEmail(email: InboundEmail): Promise<ParsedComment | null> {
    // Extract request ID from subject
    // Expected format: "Re: Request REQ-20241222-0001" or similar
    const subjectMatch = email.subject.match(/REQ-\d{8}-\d{4}/);
    if (!subjectMatch) {
      console.log('No request ID found in subject:', email.subject);
      return null;
    }

    const requestId = await this.getRequestIdByNumber(subjectMatch[0]);
    if (!requestId) {
      console.log('Request not found for number:', subjectMatch[0]);
      return null;
    }

    // Clean email body (remove quoted text, signatures, etc.)
    const cleanContent = this.cleanEmailBody(email.body);

    return {
      requestId,
      userEmail: email.from,
      content: cleanContent,
    };
  }

  /**
   * Create comment from parsed email
   */
  async createCommentFromEmail(parsed: ParsedComment): Promise<Comment | null> {
    // Find user by email
    const user = await this.db.queryOne<any>(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [parsed.userEmail]
    );

    if (!user) {
      console.log('User not found for email:', parsed.userEmail);
      return null;
    }

    return this.addComment({
      requestId: parsed.requestId,
      userId: user.id,
      content: parsed.content,
      viaEmail: true,
    });
  }

  /**
   * Get all participants in a request conversation
   * Includes: creator, all approvers, all commenters
   */
  async getParticipants(requestId: string): Promise<string[]> {
    const participants = new Set<string>();

    // Get request creator
    const request = await this.db.queryOne<any>(
      'SELECT creator_id FROM requests WHERE id = $1',
      [requestId]
    );
    if (request) {
      participants.add(request.creator_id);
    }

    // Get all approvers
    const approvers = await this.db.query<any>(
      'SELECT DISTINCT approver_id FROM approvals WHERE request_id = $1',
      [requestId]
    );
    approvers.forEach((a) => participants.add(a.approver_id));

    // Get all commenters
    const commenters = await this.db.query<any>(
      'SELECT DISTINCT user_id FROM comments WHERE request_id = $1',
      [requestId]
    );
    commenters.forEach((c) => participants.add(c.user_id));

    return Array.from(participants);
  }

  /**
   * Get request ID from request number
   */
  private async getRequestIdByNumber(requestNumber: string): Promise<string | null> {
    const row = await this.db.queryOne<any>(
      'SELECT id FROM requests WHERE request_number = $1',
      [requestNumber]
    );

    return row?.id || null;
  }

  /**
   * Clean email body
   * Remove quoted text, signatures, and formatting
   */
  private cleanEmailBody(body: string): string {
    // Remove quoted text (lines starting with >)
    let cleaned = body
      .split('\n')
      .filter((line) => !line.trim().startsWith('>'))
      .join('\n');

    // Remove common email signatures
    const signatureMarkers = ['--', '___', 'Sent from', 'Get Outlook'];
    for (const marker of signatureMarkers) {
      const markerIndex = cleaned.indexOf(marker);
      if (markerIndex > 0) {
        cleaned = cleaned.substring(0, markerIndex);
      }
    }

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Map database row to Comment object
   */
  private mapRowToComment(row: any): Comment {
    return {
      id: row.id,
      requestId: row.request_id,
      userId: row.user_id,
      content: row.content,
      viaEmail: row.via_email,
      createdAt: new Date(row.created_at),
    };
  }
}
