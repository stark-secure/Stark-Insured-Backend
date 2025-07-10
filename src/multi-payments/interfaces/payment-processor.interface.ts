import { TransactionDetailsDto, PaymentVerificationResultDto, FeeEstimateDto, GeneratedAddressDto } from "../dto/payment.dto";

// Stub for Payment Processor Interface
export interface PaymentProcessor {
  verifyTransaction(txHash: string): Promise<PaymentVerificationResultDto>;
  generateAddress(userId?: string): Promise<GeneratedAddressDto>;
  estimateFee(amount: number, toAddress: string): Promise<FeeEstimateDto>;
  getChainConfig?(): any;
}
export interface ChainConfig {}
export enum SupportedChain {
  ETHEREUM = 'ethereum',
  STARKNET = 'starknet',
}
export interface PaymentVerificationResult {}
