import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
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
    this.baseUrl = this.config.get<string>('SWISH_BASE_URL')?.trim() ?? null;
    this.merchantNumber = this.config.get<string>('SWISH_MERCHANT_NUMBER')?.trim() ?? null;
    this.callbackUrl = this.config.get<string>('SWISH_CALLBACK_URL')?.trim() ?? null;

    const certPath = this.config.get<string>('SWISH_CERT_PATH')?.trim();
    const keyPath = this.config.get<string>('SWISH_KEY_PATH')?.trim();
    const caPath = this.config.get<string>('SWISH_CA_PATH')?.trim();
    const passphrase = this.config.get<string>('SWISH_PASSPHRASE')?.trim() || undefined;

    if (certPath && keyPath) {
      try {
        this.agent = new HttpsAgent({
          cert: readFileSync(certPath),
          key: readFileSync(keyPath),
          ca: caPath ? readFileSync(caPath) : undefined,
          passphrase,
          rejectUnauthorized: true,
          keepAlive: true,
        });
      } catch (err) {
        this.logger.error(`Failed to load Swish mTLS material: ${(err as Error).message}`);
        this.agent = null;
      }
    } else {
      this.agent = null;
    }
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
   * Create an e-commerce payment request.
   * Swish responds 201 with Location header (= full URL to the payment resource) and a
   * PaymentRequestToken header used to render a QR code or app-switch link.
   */
  async createEcommercePayment(
    instructionUuid: string,
    body: SwishCreatePaymentRequest,
  ): Promise<SwishCreatePaymentResult> {
    const res = await this.request('PUT', `/swish-cpcapi/api/v2/paymentrequests/${instructionUuid}`, body);
    if (res.status !== 201) {
      throw new Error(`Swish create payment failed (${res.status}): ${res.body}`);
    }
    const location = res.headers['location'] ?? '';
    const swishPaymentId = location.split('/').pop() ?? instructionUuid;
    const paymentRequestToken = res.headers['paymentrequesttoken'] ?? null;
    return { location, swishPaymentId, paymentRequestToken };
  }

  async getPayment(swishPaymentId: string): Promise<SwishPaymentResponse> {
    const res = await this.request('GET', `/swish-cpcapi/api/v1/paymentrequests/${swishPaymentId}`);
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Swish get payment failed (${res.status}): ${res.body}`);
    }
    return JSON.parse(res.body) as SwishPaymentResponse;
  }

  async cancelPayment(swishPaymentId: string): Promise<void> {
    const res = await this.request(
      'PATCH',
      `/swish-cpcapi/api/v1/paymentrequests/${swishPaymentId}`,
      [{ op: 'replace', path: '/status', value: 'cancelled' }],
      'application/json-patch+json',
    );
    if (res.status !== 200) {
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
    const url = new URL(path, this.baseUrl);
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
