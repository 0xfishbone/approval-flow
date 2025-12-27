/**
 * SignatureCore - Visual and digital signature management
 * ~200 lines
 * Dependencies: DatabaseWrapper, StorageWrapper
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { DatabaseWrapper, StorageWrapper } from '../../platform';
import {
  SignatureCoreInterface,
  DigitalSignatureInput,
  DigitalSignature,
  VerificationResult,
  SignatureMetadata,
} from './signature.types';

export class SignatureCore implements SignatureCoreInterface {
  private db: DatabaseWrapper;
  private storage: StorageWrapper;
  private algorithm = 'sha256'; // Algorithm for digital signatures

  constructor(db: DatabaseWrapper, storage: StorageWrapper) {
    this.db = db;
    this.storage = storage;
  }

  /**
   * Save visual signature image
   * Stores image in S3/R2 and updates user record
   */
  async saveVisualSignature(
    userId: string,
    imageData: Buffer,
    mimeType: string = 'image/png'
  ): Promise<string> {
    // Upload to storage
    const key = `signatures/visual/${userId}/${Date.now()}.png`;
    const fileUrl = await this.storage.uploadFile(key, imageData, mimeType);

    // Update user record
    await this.db.update('users', userId, {
      visual_signature_url: fileUrl,
    });

    // Create signature record
    await this.db.insert('signatures', {
      id: uuidv4(),
      user_id: userId,
      image_url: fileUrl,
    });

    return fileUrl;
  }

  /**
   * Get visual signature URL for a user
   */
  async getVisualSignatureUrl(userId: string): Promise<string | null> {
    const user = await this.db.queryOne<any>(
      'SELECT visual_signature_url FROM users WHERE id = $1',
      [userId]
    );

    return user?.visual_signature_url || null;
  }

  /**
   * Create digital signature
   * Uses SHA-256 hash with HMAC for signing data
   */
  async createDigitalSignature(input: DigitalSignatureInput): Promise<DigitalSignature> {
    // Generate signature using HMAC-SHA256
    // In production, this would use the user's private key (ECDSA)
    // For now, we use HMAC with user ID as key
    const signature = crypto
      .createHmac(this.algorithm, input.userId)
      .update(input.data)
      .digest('hex');

    const digitalSig = await this.db.insert<any>('digital_signatures', {
      id: uuidv4(),
      user_id: input.userId,
      request_id: input.requestId,
      signature,
      algorithm: this.algorithm,
      metadata: JSON.stringify(input.metadata),
    });

    return this.mapRowToDigitalSignature(digitalSig);
  }

  /**
   * Verify digital signature
   * Checks if signature matches the provided data
   */
  async verifyDigitalSignature(
    signatureId: string,
    data: string
  ): Promise<VerificationResult> {
    const row = await this.db.queryOne<any>(
      'SELECT * FROM digital_signatures WHERE id = $1',
      [signatureId]
    );

    if (!row) {
      return {
        isValid: false,
        signedBy: '',
        timestamp: new Date(),
        tamperedWith: true,
      };
    }

    // Re-compute signature
    const expectedSignature = crypto
      .createHmac(this.algorithm, row.user_id)
      .update(data)
      .digest('hex');

    const isValid = expectedSignature === row.signature;

    // Get user info
    const user = await this.db.queryOne<any>(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [row.user_id]
    );

    return {
      isValid,
      signedBy: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
      timestamp: new Date(row.timestamp),
      tamperedWith: !isValid,
    };
  }

  /**
   * Get all digital signatures for a request
   */
  async getDigitalSignaturesByRequest(requestId: string): Promise<DigitalSignature[]> {
    const rows = await this.db.query<any>(
      'SELECT * FROM digital_signatures WHERE request_id = $1 ORDER BY timestamp ASC',
      [requestId]
    );

    return rows.map(this.mapRowToDigitalSignature);
  }

  /**
   * Generate signature hash for approval data
   * Used when creating approvals
   */
  generateSignatureHash(userId: string, requestId: string, timestamp: Date): string {
    const data = `${userId}:${requestId}:${timestamp.toISOString()}`;
    return crypto.createHmac(this.algorithm, userId).update(data).digest('hex');
  }

  /**
   * Capture biometric metadata
   * Helper method for mobile clients
   */
  captureBiometricMetadata(
    deviceInfo: string,
    ipAddress: string,
    location?: string,
    biometricUsed: boolean = false
  ): SignatureMetadata {
    return {
      deviceInfo,
      ipAddress,
      location: location || null,
      biometricUsed,
    };
  }

  /**
   * Map database row to DigitalSignature object
   */
  private mapRowToDigitalSignature(row: any): DigitalSignature {
    let metadata: SignatureMetadata;
    try {
      metadata =
        typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    } catch {
      metadata = {
        deviceInfo: 'Unknown',
        ipAddress: 'Unknown',
        location: null,
        biometricUsed: false,
      };
    }

    return {
      id: row.id,
      userId: row.user_id,
      requestId: row.request_id,
      signature: row.signature,
      algorithm: row.algorithm,
      timestamp: new Date(row.timestamp),
      metadata,
    };
  }
}
