import { ApiProperty } from '@nestjs/swagger'

// Payment DTOs and Enums
export class TransactionDetailsDto {
  @ApiProperty({ description: 'Block number of transaction', required: false })
  blockNumber?: number;

  @ApiProperty({ description: 'Sender address', required: false })
  fromAddress?: string;

  @ApiProperty({ description: 'Recipient address', required: false })
  toAddress?: string;

  @ApiProperty({ description: 'Number of confirmations', required: false })
  confirmationCount?: number;
}

export class PaymentVerificationResultDto {
  @ApiProperty({ description: 'Whether the payment was verified', required: false })
  isValid?: boolean;

  @ApiProperty({ description: 'Verification error message if any', required: false })
  error?: string;

  @ApiProperty({ description: 'Transaction details', required: false, type: TransactionDetailsDto })
  transactionDetails?: TransactionDetailsDto;
}

export class FeeEstimateDto {
  @ApiProperty({ description: 'Chain name', required: false })
  chainName?: string;

  @ApiProperty({ description: 'Estimated fee amount', required: false })
  amount?: number;

  @ApiProperty({ description: 'To address for fee estimation', required: false })
  toAddress?: string;
}

export class GeneratedAddressDto {}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Chain name', required: false })
  chainName?: string;

  @ApiProperty({ description: 'Payment type', required: false })
  type?: string;

  @ApiProperty({ description: 'Amount to pay', required: false })
  amount?: number;

  @ApiProperty({ description: 'Currency token', required: false })
  currency?: string;

  @ApiProperty({ description: 'Optional to address', required: false })
  toAddress?: string;

  @ApiProperty({ description: 'Optional metadata', required: false })
  metadata?: any;
}

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Transaction hash', required: false })
  txHash?: string;

  @ApiProperty({ description: 'Chain name', required: false })
  chainName?: string;

  @ApiProperty({ description: 'Expected amount', required: false })
  expectedAmount?: number;

  @ApiProperty({ description: 'Expected to address', required: false })
  expectedToAddress?: string;
}

export class PaymentFilterDto {
  @ApiProperty({ description: 'Status filter', required: false })
  status?: string;

  @ApiProperty({ description: 'Chain name filter', required: false })
  chainName?: string;

  @ApiProperty({ description: 'Payment type filter', required: false })
  type?: string;

  @ApiProperty({ description: 'Start date filter (YYYY-MM-DD)', required: false })
  startDate?: string;

  @ApiProperty({ description: 'End date filter (YYYY-MM-DD)', required: false })
  endDate?: string;
}

export class PaymentResponseDto {}
export class ChainInfoDto {}
export class EstimateFeeDto {
  @ApiProperty({ description: 'Chain name', required: false })
  chainName?: string;

  @ApiProperty({ description: 'Amount for estimate', required: false })
  amount?: number;

  @ApiProperty({ description: 'To address', required: false })
  toAddress?: string;
}

export enum SupportedChain {
  ETHEREUM = 'ethereum',
  STARKNET = 'starknet',
}
