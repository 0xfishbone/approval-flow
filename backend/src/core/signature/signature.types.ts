/**
 * Signature Types
 * Visual signatures (canvas images) and digital signatures (ECDSA)
 */

export interface SignatureMetadata {
  deviceInfo: string;
  ipAddress: string;
  location: string | null;
  biometricUsed: boolean;
}

export interface DigitalSignatureInput {
  userId: string;
  requestId: string;
  data: string; // Data to sign
  metadata: SignatureMetadata;
}

export interface DigitalSignature {
  id: string;
  userId: string;
  requestId: string;
  signature: string;
  algorithm: string;
  timestamp: Date;
  metadata: SignatureMetadata;
}

export interface VerificationResult {
  isValid: boolean;
  signedBy: string;
  timestamp: Date;
  tamperedWith: boolean;
}

export interface SignatureCoreInterface {
  // Visual signature management
  saveVisualSignature(userId: string, imageData: Buffer, mimeType?: string): Promise<string>;
  getVisualSignatureUrl(userId: string): Promise<string | null>;

  // Digital signature operations
  createDigitalSignature(input: DigitalSignatureInput): Promise<DigitalSignature>;
  verifyDigitalSignature(signatureId: string, data: string): Promise<VerificationResult>;
  getDigitalSignaturesByRequest(requestId: string): Promise<DigitalSignature[]>;
}
