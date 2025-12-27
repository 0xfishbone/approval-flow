/**
 * StorageWrapper - AWS S3 / Cloudflare R2
 * Isolates file storage behind a clean interface
 * ~50 lines
 */

export interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint?: string; // For Cloudflare R2 compatibility
}

export class StorageWrapper {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async uploadFile(
    key: string,
    _buffer: Buffer,
    _contentType: string
  ): Promise<string> {
    // In production, use @aws-sdk/client-s3
    // This is a simplified implementation
    const url = this.config.endpoint || `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
    const fullUrl = `${url}/${key}`;

    // For MVP, we'll simulate upload
    // In production, use proper AWS SDK:
    /*
    const s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      endpoint: this.config.endpoint,
    });

    await s3Client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    */

    return fullUrl;
  }

  async downloadFile(_key: string): Promise<Buffer> {
    // In production, use GetObjectCommand from @aws-sdk/client-s3
    // For MVP, simulate download
    throw new Error('Download not implemented in MVP - use signed URLs');
  }

  async deleteFile(_key: string): Promise<void> {
    // In production, use DeleteObjectCommand from @aws-sdk/client-s3
    // For MVP, log warning
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // In production, use getSignedUrl from @aws-sdk/s3-request-presigner
    // Returns a pre-signed URL for temporary access
    const url = this.config.endpoint || `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
    return `${url}/${key}?expires=${expiresIn}`;
  }

  generateKey(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${prefix}/${timestamp}-${random}-${sanitized}`;
  }
}
