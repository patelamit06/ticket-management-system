import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client | null = null;
  /** Client used only for presigned PUT URLs so the browser uploads to localhost (avoids cross-origin / provisional headers). */
  private presignClient: Minio.Client | null = null;
  private bucket: string = 'events';
  private publicBaseUrl: string = '';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const endpointRaw = this.config.get<string>('MINIO_ENDPOINT');
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY');
    if (!endpointRaw || !accessKey || !secretKey) {
      return;
    }
    // Use 127.0.0.1 instead of localhost to avoid IPv6 (::1) connection parse errors with Node HTTP client
    const endpoint = endpointRaw.trim().toLowerCase() === 'localhost' ? '127.0.0.1' : endpointRaw.trim();
    const portRaw = this.config.get<string>('MINIO_PORT');
    const port = portRaw != null ? parseInt(String(portRaw), 10) : undefined;
    const useSSL = this.config.get<string>('MINIO_USE_SSL') === 'true';
    const effectivePort = Number.isFinite(port) ? port! : (useSSL ? 443 : 9000);
    this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'events';
    this.client = new Minio.Client({
      endPoint: endpoint,
      port: effectivePort,
      useSSL,
      accessKey,
      secretKey,
      region: 'us-east-1',
    });
    // Presigned URLs are used by the browser (localhost:3000); use localhost so PUT goes to localhost:9000 and completes
    const presignEndpoint = endpoint === '127.0.0.1' ? 'localhost' : endpointRaw.trim();
    this.presignClient = new Minio.Client({
      endPoint: presignEndpoint,
      port: effectivePort,
      useSSL,
      accessKey,
      secretKey,
      region: 'us-east-1',
    });
    const protocol = useSSL ? 'https' : 'http';
    const portPart = Number.isFinite(port) ? `:${port}` : (useSSL ? '' : ':9000');
    const hostForPublicUrl = endpoint === '127.0.0.1' ? 'localhost' : endpointRaw.trim();
    this.publicBaseUrl =
      this.config.get<string>('MINIO_PUBLIC_URL') ??
      `${protocol}://${hostForPublicUrl}${portPart}/${this.bucket}`;
    this.ensureBucketAsync();
  }

  isAvailable(): boolean {
    return this.client != null;
  }

  getPublicUrl(objectKey: string): string {
    return `${this.publicBaseUrl}/${objectKey}`;
  }

  /** S3 bucket policy: allow public read (GetObject) on all objects in the bucket. */
  private getPublicReadPolicy(): string {
    return JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    });
  }

  /**
   * Ensure the bucket exists and set public read policy. Runs in background at startup.
   * If this fails, create bucket "events" and set Access to public in MinIO Console (http://localhost:9001).
   */
  private ensureBucketAsync(): void {
    if (!this.client) return;
    const bucket = this.bucket;
    const policy = this.getPublicReadPolicy();
    this.client
      .bucketExists(bucket)
      .then((exists) => {
        if (!exists) return this.client!.makeBucket(bucket, 'us-east-1');
      })
      .then(() => this.client!.setBucketPolicy(bucket, policy))
      .catch(() => {
        // Bucket/policy setup failed; user can create bucket and set access in MinIO Console
      });
  }

  /**
   * Generate a presigned PUT URL so the browser can upload directly to MinIO.
   * Uses a client configured with localhost (when backend uses 127.0.0.1) so the URL points to
   * localhost:9000 and the browser request completes without cross-origin / provisional headers issues.
   */
  async getPresignedPutUrl(objectKey: string, expirySeconds = 60 * 15): Promise<string> {
    const client = this.presignClient ?? this.client;
    if (!client) throw new Error('MinIO is not configured');
    return client.presignedPutObject(this.bucket, objectKey, expirySeconds);
  }

  /**
   * Get a presigned GET URL for an object (e.g. when bucket is not public).
   */
  async getPresignedGetUrl(objectKey: string, expirySeconds = 60 * 60 * 24 * 7): Promise<string> {
    if (!this.client) throw new Error('MinIO is not configured');
    return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
  }
}
