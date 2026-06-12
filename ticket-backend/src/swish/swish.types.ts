export type SwishPaymentStatus =
  | 'CREATED'
  | 'PAID'
  | 'DECLINED'
  | 'ERROR'
  | 'CANCELLED';

export interface SwishCreatePaymentRequest {
  payeePaymentReference: string;
  callbackUrl: string;
  payerAlias?: string;
  payeeAlias: string;
  amount: string;
  currency: string;
  message?: string;
  callbackIdentifier?: string;
}

export interface SwishCreatePaymentResult {
  location: string;
  swishPaymentId: string;
  paymentRequestToken: string | null;
}

export interface SwishPaymentResponse {
  id: string;
  payeePaymentReference?: string;
  paymentReference?: string;
  callbackUrl?: string;
  payerAlias?: string;
  payeeAlias?: string;
  amount?: number;
  currency?: string;
  message?: string;
  status: SwishPaymentStatus;
  dateCreated?: string;
  datePaid?: string;
  errorCode?: string;
  errorMessage?: string;
}
