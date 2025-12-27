/**
 * Comment Types
 * In-app comments and email reply handling
 */

export interface Comment {
  id: string;
  requestId: string;
  userId: string;
  content: string;
  viaEmail: boolean;
  createdAt: Date;
}

export interface CommentInput {
  requestId: string;
  userId: string;
  content: string;
  viaEmail?: boolean;
}

export interface InboundEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  html: string;
  messageId: string;
  receivedAt: Date;
}

export interface ParsedComment {
  requestId: string;
  userEmail: string;
  content: string;
}

export interface CommentCoreInterface {
  // Comment operations
  addComment(input: CommentInput): Promise<Comment>;
  getComments(requestId: string): Promise<Comment[]>;

  // Email reply handling
  parseInboundEmail(email: InboundEmail): Promise<ParsedComment | null>;
  createCommentFromEmail(parsed: ParsedComment): Promise<Comment | null>;

  // Participant management
  getParticipants(requestId: string): Promise<string[]>;
}
