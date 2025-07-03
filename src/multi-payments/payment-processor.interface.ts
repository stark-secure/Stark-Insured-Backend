import { TransactionDetailsDto, PaymentVerificationResultDto, FeeEstimateDto, GeneratedAddressDto } from "../dto/payment.dto"

export enum SupportedChain {
  ETHEREUM = "ethereum",
  STARKNET = "starknet",
}

export interface ChainConfig {
  chainId: string
  chainName: SupportedChain
  nativeCurrency: string
  explorerUrl: string
  requiredConfirmations: number
  rpcUrl: string
  isTestnet?: boolean
}

export interface PaymentProcessor {
  /**
   * Get the chain configuration
   */
  getChainConfig(): ChainConfig

  /**
   * Verify a transaction on the blockchain
   * @param txHash The transaction hash to verify
   */
  verifyTransaction(txHash: string): Promise<PaymentVerificationResult>

  /**
   * Generate a new address for receiving payments
   * @param userId Optional user ID to associate with the address
   */
  generateAddress(userId?: string): Promise<GeneratedAddressDto>

  /**
   * Estimate the fee for a transaction
   * @param amount The amount to send
   * @param toAddress The recipient address
   */
  estimateFee(amount: number, toAddress: string): Promise<FeeEstimateDto>

  /**
   * Get the transaction URL for the explorer
   * @param txHash The transaction hash
   */
  getTransactionExplorerUrl(txHash: string): string
}

export interface PaymentVerificationResult {
  isValid: boolean
  error?: string
  transactionDetails?: TransactionDetailsDto
}

export abstract class PaymentProcessor implements PaymentProcessor {
  protected chainConfig: ChainConfig

  constructor(chainConfig: ChainConfig) {
    this.chainConfig = chainConfig
  }

  getChainConfig(): ChainConfig {
    return this.chainConfig
  }

  abstract verifyTransaction(txHash: string): Promise<PaymentVerificationResult>

  abstract generateAddress(userId?: string): Promise<GeneratedAddressDto>

  abstract estimateFee(amount: number, toAddress: string): Promise<FeeEstimateDto>

  getTransactionExplorerUrl(txHash: string): string {
    return `${this.chainConfig.explorerUrl}/tx/${txHash}`
  }
}
