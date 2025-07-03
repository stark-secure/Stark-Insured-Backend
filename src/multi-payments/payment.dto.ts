import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, Matches } from "class-validator"
import { PaymentType, PaymentStatus } from "../entities/payment.entity"
import { SupportedChain } from "../interfaces/payment-processor.interface"

export class CreatePaymentDto {
  @IsEnum(PaymentType)
  @IsNotEmpty()
  type: PaymentType

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number

  @IsString()
  @IsNotEmpty()
  currency: string

  @IsEnum(SupportedChain)
  @IsNotEmpty()
  chainName: SupportedChain

  @IsString()
  @IsOptional()
  @MaxLength(100)
  toAddress?: string

  @IsOptional()
  metadata?: Record<string, any>
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  txHash: string

  @IsEnum(SupportedChain)
  @IsNotEmpty()
  chainName: SupportedChain

  @IsNumber()
  @IsOptional()
  @Min(0)
  expectedAmount?: number

  @IsString()
  @IsOptional()
  @MaxLength(100)
  expectedToAddress?: string
}

export class PaymentFilterDto {
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus

  @IsEnum(SupportedChain)
  @IsOptional()
  chainName?: SupportedChain

  @IsEnum(PaymentType)
  @IsOptional()
  type?: PaymentType

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string
}

export class GenerateAddressDto {
  @IsEnum(SupportedChain)
  @IsNotEmpty()
  chainName: SupportedChain

  @IsUUID()
  @IsOptional()
  userId?: string
}

export class EstimateFeeDto {
  @IsEnum(SupportedChain)
  @IsNotEmpty()
  chainName: SupportedChain

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  toAddress: string
}

export class PaymentResponseDto {
  id: string
  userId: string
  type: PaymentType
  amount: number
  currency: string
  chainName: string
  chainId: string
  txHash?: string
  blockNumber?: string
  fromAddress?: string
  toAddress?: string
  status: PaymentStatus
  confirmationCount: number
  requiredConfirmations: number
  metadata?: Record<string, any>
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date
}

export class ChainInfoDto {
  chainId: string
  chainName: string
  nativeCurrency: string
  explorerUrl: string
  requiredConfirmations: number
  isTestnet: boolean
}

export class TransactionDetailsDto {
  txHash: string
  blockNumber: string
  fromAddress: string
  toAddress: string
  amount: string
  currency: string
  confirmationCount: number
  timestamp?: Date
  gasUsed?: string
  gasPrice?: string
  metadata?: Record<string, any>
}

export class PaymentVerificationResultDto {
  isValid: boolean
  error?: string
  transactionDetails?: TransactionDetailsDto
}

export class FeeEstimateDto {
  estimatedFee: string
  currency: string
  gasLimit?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
}

export class GeneratedAddressDto {
  address: string
  chainName: string
  chainId: string
  qrCode?: string
}
