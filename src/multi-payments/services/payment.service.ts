import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, FindOptionsWhere, Between } from "typeorm"
import { Payment, PaymentStatus, PaymentType } from "../entities/payment.entity"
import { EthereumPaymentService } from "./payment-processors/ethereum-payment.service"
import { StarkNetPaymentService } from "./payment-processors/starknet-payment.service"
import { PaymentProcessor, SupportedChain, ChainConfig } from "../interfaces/payment-processor.interface"
import {
  CreatePaymentDto,
  VerifyPaymentDto,
  PaymentFilterDto,
  PaymentResponseDto,
  ChainInfoDto,
  GenerateAddressDto,
  GeneratedAddressDto,
  EstimateFeeDto,
  FeeEstimateDto,
} from "../dto/payment.dto"

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name)
  private paymentProcessors: Map<SupportedChain, PaymentProcessor>

  constructor(
    private paymentRepository: Repository<Payment>,
    private ethereumPaymentService: EthereumPaymentService,
    private starknetPaymentService: StarkNetPaymentService,
  ) {
    // Register all payment processors
    this.paymentProcessors = new Map([
      [SupportedChain.ETHEREUM, this.ethereumPaymentService],
      [SupportedChain.STARKNET, this.starknetPaymentService],
    ])
  }

  /**
   * Get the payment processor for a specific chain
   */
  private getPaymentProcessor(chainName: SupportedChain): PaymentProcessor {
    const processor = this.paymentProcessors.get(chainName)
    if (!processor) {
      throw new BadRequestException(`Unsupported chain: ${chainName}`)
    }
    return processor
  }

  /**
   * Create a new payment
   */
  async createPayment(userId: string, createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const { chainName, type, amount, currency, toAddress, metadata } = createPaymentDto

    // Get the payment processor for the specified chain
    const processor = this.getPaymentProcessor(chainName)
    const chainConfig = processor.getChainConfig()

    // Create the payment entity
    const payment = this.paymentRepository.create({
      userId,
      type,
      amount,
      currency,
      chainName,
      chainId: chainConfig.chainId,
      toAddress,
      status: PaymentStatus.PENDING,
      requiredConfirmations: chainConfig.requiredConfirmations,
      metadata,
      // Set expiration time (e.g., 24 hours from now)
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    // Save the payment to the database
    const savedPayment = await this.paymentRepository.save(payment)
    this.logger.log(`Created payment: ${savedPayment.id} for chain: ${chainName}`)

    return this.mapPaymentToResponseDto(savedPayment)
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(paymentId: string, verifyPaymentDto: VerifyPaymentDto): Promise<PaymentResponseDto> {
    const { txHash, chainName, expectedAmount, expectedToAddress } = verifyPaymentDto

    // Find the payment
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } })
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`)
    }

    // Validate chain matches
    if (payment.chainName !== chainName) {
      throw new BadRequestException(`Chain mismatch: Payment is for ${payment.chainName}, but verification is for ${chainName}`)
    }

    // Get the payment processor
    const processor = this.getPaymentProcessor(chainName as SupportedChain)

    // Verify the transaction
    const verificationResult = await processor.verifyTransaction(txHash)

    if (!verificationResult.isValid) {
      throw new BadRequestException(`Invalid transaction: ${verificationResult.error}`)
    }

    const { transactionDetails } = verificationResult

    // Validate expected amount if provided
    if (expectedAmount !== undefined) {
      const txAmount = parseFloat(transactionDetails.amount)
      if (txAmount < expectedAmount) {
        throw new BadRequestException(`Amount mismatch: Expected ${expectedAmount}, but got ${txAmount}`)
      }
    }

    // Validate expected recipient address if provided
    if (expectedToAddress && transactionDetails.toAddress !== expectedToAddress) {
      throw new BadRequestException(
        `Recipient address mismatch: Expected ${expectedToAddress}, but got ${transactionDetails.toAddress}`,
      )
    }

    // Update payment with transaction details
    payment.txHash = txHash
    payment.blockNumber = transactionDetails.blockNumber
    payment.fromAddress = transactionDetails.fromAddress
    payment.toAddress = transactionDetails.toAddress
    payment.confirmationCount = transactionDetails.confirmationCount
    payment.status =
      transactionDetails.confirmationCount >= payment.requiredConfirmations
        ? PaymentStatus.CONFIRMED
        : PaymentStatus.PROCESSING
    
    // If payment is confirmed, set the confirmation timestamp
    if (payment.status === PaymentStatus.CONFIRMED) {
      payment.confirmedAt = new Date()
    }

    // Save the updated payment
    const updatedPayment = await this.paymentRepository.save(payment)
    this.logger.log(`Verified payment: ${paymentId} with transaction: ${txHash}`)

    return this.mapPaymentToResponseDto(updatedPayment)
  }

  /**
   * Get a payment by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } })
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`)
    }
    return this.mapPaymentToResponseDto(payment)
  }

  /**
   * Get payments by user ID with optional filters
   */
  async getUserPayments(userId: string, filterDto: PaymentFilterDto): Promise<PaymentResponseDto[]> {
    const { status, chainName, type, startDate, endDate } = filterDto
    
    const where: FindOptionsWhere<Payment> = { userId }
    
    if (status) {
      where.status = status
    }
    
    if (chainName) {
      where.chainName = chainName
    }
    
    if (type) {
      where.type = type
    }
    
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate))
    }
    
    const payments = await this.paymentRepository.find({
      where,
      order: { createdAt: "DESC" },
    })
    
    return payments.map(payment => this.mapPaymentToResponseDto(payment))
  }

  /**
   * Get supported chains information
   */
  getSupportedChains(): ChainInfoDto[] {
    const chains: ChainInfoDto[] = []
    
    this.paymentProcessors.forEach(processor => {
      const config = processor.getChainConfig()
      chains.push({
        chainId: config.chainId,
        chainName: config.chainName,
        nativeCurrency: config.nativeCurrency,
        explorerUrl: config.explorerUrl,
        requiredConfirmations: config.requiredConfirmations,
        isTestnet: config.isTestnet || false,
      })
    })
    
    return chains
  }

  /**
   * Generate a payment address for a specific chain
   */
  async generateAddress(generateAddressDto: GenerateAddressDto): Promise<GeneratedAddressDto> {
    const { chainName, userId } = generateAddressDto
    
    const processor = this.getPaymentProcessor(chainName)
    return processor.generateAddress(userId)
  }

  /**
   * Estimate transaction fee for a specific chain
   */
  async estimateFee(estimateFeeDto: EstimateFeeDto): Promise<FeeEstimateDto> {
    const { chainName, amount, toAddress } = estimateFeeDto
    
    const processor = this.getPaymentProcessor(chainName)
    return processor.estimateFee(amount, toAddress)
  }

  /**
   * Map a Payment entity to a PaymentResponseDto
   */
  private mapPaymentToResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      userId: payment.userId,
      type: payment.type,
      amount: Number(payment.amount),
      currency: payment.currency,
      chainName: payment.chainName,
      chainId: payment.chainId,
      txHash: payment.txHash,
      blockNumber: payment.blockNumber,
      fromAddress: payment.fromAddress,
      toAddress: payment.toAddress,
      status: payment.status,
      confirmationCount: payment.confirmationCount,
      requiredConfirmations: payment.requiredConfirmations,
      metadata: payment.metadata,
      expiresAt: payment.expiresAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      confirmedAt: payment.confirmedAt,
    }
  }
}
