import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'node:fs';
import { Agent as HttpsAgent, request as httpsRequest } from 'node:https';
import { URL } from 'node:url';
import {
  SwishCreatePaymentRequest,
  SwishCreatePaymentResult,
  SwishPaymentResponse,
} from './swish.types';

interface SwishHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

@Injectable()
export class SwishService {
  private readonly logger = new Logger(SwishService.name);
  private readonly baseUrl: string | null;
  private readonly merchantNumber: string | null;
  private readonly callbackUrl: string | null;
  private readonly agent: HttpsAgent | null;

  constructor(private readonly config: ConfigService) {
    const rawBaseUrl = this.config.get<string>('SWISH_BASE_URL')?.trim() ?? null;
    this.baseUrl = rawBaseUrl ? this.normalizeBaseUrl(rawBaseUrl) : null;
    this.merchantNumber = this.config.get<string>('SWISH_MERCHANT_NUMBER')?.trim() ?? null;
    this.callbackUrl = this.config.get<string>('SWISH_CALLBACK_URL')?.trim() ?? null;

    const pfxPath = this.config.get<string>('SWISH_CERT_PATH')?.trim();
    const caPath = this.config.get<string>('SWISH_CA_PATH')?.trim();
    const passphrase = this.config.get<string>('SWISH_PASSPHRASE')?.trim() || undefined;

    if (pfxPath) {
      try {
        if (!existsSync(pfxPath)) {
          throw new Error(`Missing client certificate: ${pfxPath}`);
        }

        const pfxContent = readFileSync(pfxPath);

        this.logger.log(`Loading PKCS#12 certificate from: ${pfxPath}`);

        let caContent: Buffer | undefined;
        if (caPath) {
          if (!existsSync(caPath)) {
            throw new Error(`Missing CA certificate: ${caPath}`);
          }
          const caPemContent = readFileSync(caPath, 'utf8');

          if (!caPemContent.includes('BEGIN CERTIFICATE')) {
            throw new Error(
              `The CA file is not a valid PEM certificate bundle: ${caPath}`,
            );
          }

          const certCount = (caPemContent.match(/BEGIN CERTIFICATE/g) || []).length;
          if (certCount === 0) {
            throw new Error(`No certificates were loaded from PEM file: ${caPath}`);
          }

          caContent = Buffer.from(caPemContent);
          this.logger.log(`Loaded ${certCount} CA certificate(s) from: ${caPath}`);
        }

        this.agent = new HttpsAgent({
          pfx: pfxContent,
          passphrase,
          ca: caContent,
          rejectUnauthorized: true,
          keepAlive: true,
        });

        this.logger.log(`Swish mTLS configured with certificate: ${pfxPath}`);
      } catch (err) {
        this.logger.error(`Failed to load Swish mTLS material: ${(err as Error).message}`);
        this.agent = null;
      }
    } else {
      this.agent = null;
    }
  }

  /**
   * Normalizes the base URL to ensure consistent formatting.
   * Removes trailing slashes and '/paymentrequests' suffix if present,
   * then ensures a single trailing slash.
   */
  private normalizeBaseUrl(baseUrl: string): string {
    let normalized = baseUrl.replace(/\/+$/, '');

    if (normalized.toLowerCase().endsWith('/paymentrequests')) {
      normalized = normalized.slice(0, -'/paymentrequests'.length);
    }

    return `${normalized}/`;
  }

  isConfigured(): boolean {
    return !!this.baseUrl && !!this.merchantNumber && !!this.agent && !!this.callbackUrl;
  }

  getMerchantNumber(): string {
    if (!this.merchantNumber) throw new Error('SWISH_MERCHANT_NUMBER is not configured');
    return this.merchantNumber;
  }

  getCallbackUrl(): string {
    if (!this.callbackUrl) throw new Error('SWISH_CALLBACK_URL is not configured');
    return this.callbackUrl;
  }

  /**
   * Validates payment request parameters.
   */
  private validatePaymentRequest(body: SwishCreatePaymentRequest): void {
    if (!body.payeeAlias?.trim()) {
      throw new Error('Payee alias is required');
    }

    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    if (!body.callbackUrl?.trim()) {
      throw new Error('Callback URL is required');
    }

    if (!body.currency?.trim()) {
      throw new Error('Currency is required');
    }
  }

  /**
   * Create an e-commerce payment request.
   * Swish responds 201 with Location header (= full URL to the payment resource) and a
   * PaymentRequestToken header used to render a QR code or app-switch link.
   */
  async createEcommercePayment(
    instructionUuid: string,
    body: SwishCreatePaymentRequest,
  ): Promise<SwishCreatePaymentResult> {
    this.validatePaymentRequest(body);

    this.logger.log(`Creating Swish payment: ${JSON.stringify(body)}`);

    const res = await this.request('PUT', `swish-cpcapi/api/v2/paymentrequests/${instructionUuid}`, body);

    if (res.status === 201) {
      const location = res.headers['location'] ?? '';
      const swishPaymentId = location.split('/').pop() ?? instructionUuid;
      const paymentRequestToken = res.headers['paymentrequesttoken'] ?? null;
      return { location, swishPaymentId, paymentRequestToken };
    }

    this.logger.error(`Swish API Error: ${res.status} - ${res.body}`);
    throw new Error(`Swish payment creation failed. Status: ${res.status}. Body: ${res.body}`);
  }

  async getPayment(swishPaymentId: string): Promise<SwishPaymentResponse> {
    const res = await this.request('GET', `swish-cpcapi/api/v1/paymentrequests/${swishPaymentId}`);

    if (res.status >= 200 && res.status < 300) {
      return JSON.parse(res.body) as SwishPaymentResponse;
    }

    this.logger.error(`Swish API Error: ${res.status} - ${res.body}`);
    throw new Error(`Swish get payment failed (${res.status}): ${res.body}`);
  }

  async cancelPayment(swishPaymentId: string): Promise<void> {
    const res = await this.request(
      'PATCH',
      `swish-cpcapi/api/v1/paymentrequests/${swishPaymentId}`,
      [{ op: 'replace', path: '/status', value: 'cancelled' }],
      'application/json-patch+json',
    );

    if (res.status !== 200) {
      this.logger.error(`Swish cancel failed: ${res.status} - ${res.body}`);
      throw new Error(`Swish cancel failed (${res.status}): ${res.body}`);
    }
  }

  private request(
    method: 'GET' | 'PUT' | 'PATCH' | 'POST',
    path: string,
    body?: unknown,
    contentType = 'application/json',
  ): Promise<SwishHttpResponse> {
    if (!this.baseUrl || !this.agent) {
      return Promise.reject(new Error('Swish is not configured'));
    }

    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(normalizedPath, this.baseUrl);
    const payload = body !== undefined ? JSON.stringify(body) : null;

    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        {
          method,
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          agent: this.agent!,
          headers: {
            accept: 'application/json',
            ...(payload
              ? {
                  'content-type': contentType,
                  'content-length': Buffer.byteLength(payload).toString(),
                }
              : {}),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const headers: Record<string, string> = {};
            for (const [k, v] of Object.entries(res.headers)) {
              if (typeof v === 'string') headers[k.toLowerCase()] = v;
              else if (Array.isArray(v)) headers[k.toLowerCase()] = v.join(',');
            }
            resolve({
              status: res.statusCode ?? 0,
              headers,
              body: Buffer.concat(chunks).toString('utf8'),
            });
          });
        },
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }
}