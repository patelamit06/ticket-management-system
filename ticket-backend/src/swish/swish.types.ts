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
  currency: 'SEK';
  message?: string;
}

export interface SwishCreatePaymentResult {
  location: string;
  swishPaymentId: string;
  paymentRequestToken: string | null;
}

export interface SwishPaymentResponse {
  id: string;
  payeePaymentReference: string;
  paymentReference?: string;
  callbackUrl: string;
  payerAlias?: string;
  payeeAlias: string;
  amount: number;
  currency: 'SEK';
  message?: string;
  status: SwishPaymentStatus;
  dateCreated: string;
  datePaid?: string;
  errorCode?: string;
  errorMessage?: string;
}
