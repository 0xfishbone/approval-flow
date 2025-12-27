/**
 * Document Types
 * PDF generation and document management
 */

export interface Document {
  id: string;
  requestId: string;
  documentType: 'PDF' | 'ATTACHMENT';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  generatedBy: string | null;
  createdAt: Date;
}

export interface DocumentInput {
  requestId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  generatedBy?: string;
}

export interface PDFGenerationOptions {
  requestId: string;
  companyLogo?: string;
  includeSignatures: boolean;
}

export interface DocumentCoreInterface {
  // Document management
  createDocument(input: DocumentInput): Promise<Document>;
  getDocument(id: string): Promise<Document | null>;
  getDocumentsByRequest(requestId: string): Promise<Document[]>;

  // PDF generation (simplified - would use PDFKit or Puppeteer in production)
  generatePDF(options: PDFGenerationOptions): Promise<Document>;
}
