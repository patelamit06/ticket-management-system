import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * AWS S3 storage client (official AWS SDK v3).
 *
 * The browser uploads media directly to S3 via a presigned PUT URL, then the
 * stored object is served from its public URL (or a presigned GET URL if the
 * bucket is private). The bucket and IAM user are provisioned manually — see
 * AWS_EC2_DEPLOYMENT.md. This service does NOT create buckets or set policies.
 */
@Injectable()
export class S3Service implements OnModuleInit {
  private client: S3Client | null = null;
  private bucket = '';
  private region = 'us-east-1';
  private publicBaseUrl = '';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const bucket = this.config.get<string>('S3_BUCKET');
    if (!accessKeyId || !secretAccessKey || !bucket) {
      return;
    }
    this.bucket = bucket;
    // Region must match the bucket's region for SigV4 presigned URLs to validate.
    this.region =
      this.config.get<string>('S3_REGION') ??
      this.config.get<string>('AWS_REGION') ??
      'us-east-1';
    // Optional custom endpoint for S3-compatible providers (e.g. local dev,
    // DigitalOcean Spaces). Omit for AWS S3 — the SDK derives it from the region.
    const endpoint = this.config.get<string>('S3_ENDPOINT')?.trim() || undefined;
    const forcePathStyle =
      endpoint != null || this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true';
    this.client = new S3Client({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle,
    });
    // Public base URL the browser uses to read media. Defaults to the virtual-hosted
    // S3 URL; override with S3_PUBLIC_URL to point at CloudFront or a custom domain.
    this.publicBaseUrl = (
      this.config.get<string>('S3_PUBLIC_URL') ??
      `https://${this.bucket}.s3.${this.region}.amazonaws.com`
    ).replace(/\/$/, '');
  }

  isAvailable(): boolean {
    return this.client != null;
  }

  getPublicUrl(objectKey: string): string {
    return `${this.publicBaseUrl}/${objectKey}`;
  }

  /** Presigned PUT URL so the browser can upload an object directly to S3. */
  async getPresignedPutUrl(objectKey: string, expirySeconds = 60 * 15): Promise<string> {
    if (!this.client) throw new Error('S3 is not configured');
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: objectKey });
    return getSignedUrl(this.client, command, { expiresIn: expirySeconds });
  }

  /** Presigned GET URL for reading an object when the bucket is not public. */
  async getPresignedGetUrl(objectKey: string, expirySeconds = 60 * 60 * 24 * 7): Promise<string> {
    if (!this.client) throw new Error('S3 is not configured');
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: objectKey });
    return getSignedUrl(this.client, command, { expiresIn: expirySeconds });
  }

  /** Delete an object from the bucket. */
  async deleteObject(objectKey: string): Promise<void> {
    if (!this.client) throw new Error('S3 is not configured');
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }
}
