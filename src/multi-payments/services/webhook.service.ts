import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { WebhookLog } from '../entities/webhook-log.entity';
import { WebhookPayloadDto, WebhookResponseDto, WebhookStatus } from '../dto/webhook.dto';
import { Request } from 'express';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(WebhookLog)
    private webhookLogRepository: Repository<WebhookLog>,
  ) {}

  /**
   * Process incoming webhook from payment providers
   */
  async processWebhook(
    payload: WebhookPayloadDto,
    headers: Record<string, string>,
    provider: string,
  ): Promise<WebhookResponseDto> {
    this.logger.log(`Processing webhook for payment ${payload.paymentId} from provider ${provider}`);

    // Create webhook log entry for tracking
    const webhookLog = this.webhookLogRepository.create({
      paymentId: payload.paymentId,
      status: payload.status,
      provider,
      headers,
      body: payload,
      processedAt: new Date(),
    });

    try {
      // Check for idempotency - if we've already processed this webhook
      const existingLog = await this.webhookLogRepository.findOne({
        where: {
          paymentId: payload.paymentId,
          status: payload.status,
          provider,
          processed: true,
        },
      });

      if (existingLog) {
        this.logger.log(`Duplicate webhook detected for payment ${payload.paymentId}`);
        await this.webhookLogRepository.save({
          ...webhookLog,
          processed: true,
          errorMessage: 'Duplicate webhook - already processed',
        });

        return {
          success: true,
          message: 'Webhook already processed',
          paymentId: payload.paymentId,
          isDuplicate: true,
        };
      }

      // Validate and find the payment
      const payment = await this.paymentRepository.findOne({
        where: { id: payload.paymentId },
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${payload.paymentId} not found`);
      }

      // Update payment status based on webhook
      await this.updatePaymentFromWebhook(payment, payload);

      // Mark webhook as processed
      await this.webhookLogRepository.save({
        ...webhookLog,
        processed: true,
      });

      this.logger.log(`Successfully processed webhook for payment ${payload.paymentId}`);

      return {
        success: true,
        message: 'Webhook processed successfully',
        paymentId: payload.paymentId,
        isDuplicate: false,
      };
    } catch (error) {
      this.logger.error(`Error processing webhook for payment ${payload.paymentId}: ${error.message}`);

      // Save failed webhook log
      await this.webhookLogRepository.save({
        ...webhookLog,
        processed: false,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Update payment status based on webhook payload
   */
  private async updatePaymentFromWebhook(payment: Payment, payload: WebhookPayloadDto): Promise<void> {
    // Map webhook status to payment status
    const statusMapping = {
      [WebhookStatus.SUCCESS]: PaymentStatus.CONFIRMED,
      [WebhookStatus.FAILED]: PaymentStatus.FAILED,
      [WebhookStatus.PENDING]: PaymentStatus.PROCESSING,
      [WebhookStatus.CANCELLED]: PaymentStatus.FAILED,
    };

    const newStatus = statusMapping[payload.status];
    if (!newStatus) {
      throw new BadRequestException(`Invalid webhook status: ${payload.status}`);
    }

    // Update payment fields
    payment.status = newStatus;

    if (payload.txHash) {
      payment.txHash = payload.txHash;
    }

    if (payload.blockNumber) {
      payment.blockNumber = payload.blockNumber;
    }

    if (payload.fromAddress) {
      payment.fromAddress = payload.fromAddress;
    }

    if (payload.toAddress) {
      payment.toAddress = payload.toAddress;
    }

    // Set confirmation timestamp if payment is confirmed
    if (newStatus === PaymentStatus.CONFIRMED) {
      payment.confirmedAt = new Date();
    }

    // Update metadata if provided
    if (payload.metadata) {
      payment.metadata = {
        ...payment.metadata,
        ...payload.metadata,
        lastWebhookUpdate: new Date().toISOString(),
      };
    }

    await this.paymentRepository.save(payment);

    this.logger.log(`Updated payment ${payment.id} status to ${newStatus}`);
  }

  /**
   * Verify webhook signature (if provider supports it)
   */
  async verifyWebhookSignature(
    payload: string,
    signature: string,
    provider: string,
  ): Promise<boolean> {
    // This is a placeholder for signature verification
    // In a real implementation, you would verify the signature based on the provider
    switch (provider.toLowerCase()) {
      case 'stripe':
        // Implement Stripe signature verification
        return this.verifyStripeSignature(payload, signature);
      case 'walletconnect':
        // Implement WalletConnect signature verification
        return this.verifyWalletConnectSignature(payload, signature);
      default:
        // For providers without signature verification, return true
        this.logger.warn(`No signature verification implemented for provider: ${provider}`);
        return true;
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  private verifyStripeSignature(payload: string, signature: string): boolean {
    // TODO: Implement Stripe signature verification
    // This would use the Stripe SDK to verify the webhook signature
    this.logger.log('Stripe signature verification not implemented yet');
    return true;
  }

  /**
   * Verify WalletConnect webhook signature
   */
  private verifyWalletConnectSignature(payload: string, signature: string): boolean {
    // TODO: Implement WalletConnect signature verification
    this.logger.log('WalletConnect signature verification not implemented yet');
    return true;
  }

  /**
   * Get webhook logs for debugging and monitoring
   */
  async getWebhookLogs(
    paymentId?: string,
    provider?: string,
    limit: number = 50,
  ): Promise<WebhookLog[]> {
    const query = this.webhookLogRepository.createQueryBuilder('log');

    if (paymentId) {
      query.where('log.paymentId = :paymentId', { paymentId });
    }

    if (provider) {
      query.andWhere('log.provider = :provider', { provider });
    }

    return query
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Extract provider name from request headers
   */
  extractProviderFromHeaders(headers: Record<string, string>): string {
    // Try to identify provider from headers
    if (headers['stripe-signature']) {
      return 'stripe';
    }
    if (headers['x-walletconnect-signature']) {
      return 'walletconnect';
    }
    if (headers['x-provider']) {
      return headers['x-provider'];
    }
    
    // Default to 'unknown' if no provider can be identified
    return 'unknown';
  }
} 