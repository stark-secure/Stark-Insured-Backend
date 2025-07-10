// Payment DTOs and Enums
export class TransactionDetailsDto {
  blockNumber?: number;
  fromAddress?: string;
  toAddress?: string;
  confirmationCount?: number;
}
export class PaymentVerificationResultDto {
  isValid?: boolean;
  error?: string;
  transactionDetails?: TransactionDetailsDto;
}
export class FeeEstimateDto {
  chainName?: string;
  amount?: number;
  toAddress?: string;
}
export class GeneratedAddressDto {}
export class CreatePaymentDto {
  chainName?: string;
  type?: string;
  amount?: number;
  currency?: string;
  toAddress?: string;
  metadata?: any;
}
export class VerifyPaymentDto {
  txHash?: string;
  chainName?: string;
  expectedAmount?: number;
  expectedToAddress?: string;
}
export class PaymentFilterDto {
  status?: string;
  chainName?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}
export class PaymentResponseDto {}
export class ChainInfoDto {}
export class EstimateFeeDto {
  chainName?: string;
  amount?: number;
  toAddress?: string;
}
export enum SupportedChain {
  ETHEREUM = 'ethereum',
  STARKNET = 'starknet',
}
