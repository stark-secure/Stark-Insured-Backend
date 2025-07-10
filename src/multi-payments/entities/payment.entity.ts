// Stub for Payment Entity
export class Payment {
  id?: string;
  userId?: string;
  type?: PaymentType;
  amount?: number;
  currency?: string;
  chainName?: string;
  chainId?: string;
  txHash?: string;
  blockNumber?: number;
  fromAddress?: string;
  toAddress?: string;
  status?: PaymentStatus;
  confirmationCount?: number;
  requiredConfirmations?: number;
  metadata?: any;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  confirmedAt?: Date;
}
export enum PaymentType {}
export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
}
