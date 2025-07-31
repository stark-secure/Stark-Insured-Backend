import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { WebhookLog } from '../entities/webhook-log.entity';
import { WebhookPayloadDto, WebhookStatus } from '../dto/webhook.dto';

describe('WebhookService', () => {
  let service: WebhookService;
  let paymentRepository: Repository<Payment>;
  let webhookLogRepository: Repository<WebhookLog>;

  const mockPaymentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockWebhookLogRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(WebhookLog),
          useValue: mockWebhookLogRepository,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    webhookLogRepository = module.get<Repository<WebhookLog>>(getRepositoryToken(WebhookLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processWebhook', () => {
    const mockPayload: WebhookPayloadDto = {
      paymentId: 'test-payment-123',
      status: WebhookStatus.SUCCESS,
      amount: 100,
      timestamp: '2025-01-15T10:00:00Z',
      txHash: '0x1234567890abcdef',
      blockNumber: 12345,
      fromAddress: '0xabcdef1234567890',
      toAddress: '0x1234567890abcdef',
    };

    const mockHeaders = {
      'user-agent': 'test-provider/1.0',
      'x-provider': 'stripe',
    };

    const mockPayment: Payment = {
      id: 'test-payment-123',
      userId: 'user-123',
      type: 'payment',
      amount: 100,
      currency: 'ETH',
      chainName: 'ethereum',
      chainId: '1',
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Payment;

    const mockWebhookLog: WebhookLog = {
      id: 'log-123',
      paymentId: 'test-payment-123',
      status: WebhookStatus.SUCCESS,
      provider: 'stripe',
      headers: mockHeaders,
      body: mockPayload,
      processedAt: new Date(),
      processed: false,
      createdAt: new Date(),
    };

    it('should process webhook successfully', async () => {
      // Mock no existing webhook log (not duplicate)
      mockWebhookLogRepository.findOne.mockResolvedValue(null);
      
      // Mock payment found
      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      
      // Mock webhook log creation
      mockWebhookLogRepository.create.mockReturnValue(mockWebhookLog);
      mockWebhookLogRepository.save.mockResolvedValue(mockWebhookLog);
      
      // Mock payment save
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const result = await service.processWebhook(mockPayload, mockHeaders, 'stripe');

      expect(result).toEqual({
        success: true,
        message: 'Webhook processed successfully',
        paymentId: 'test-payment-123',
        isDuplicate: false,
      });

      expect(mockWebhookLogRepository.findOne).toHaveBeenCalledWith({
        where: {
          paymentId: 'test-payment-123',
          status: WebhookStatus.SUCCESS,
          provider: 'stripe',
          processed: true,
        },
      });

      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-payment-123' },
      });

      expect(mockPaymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.CONFIRMED,
          txHash: '0x1234567890abcdef',
          blockNumber: 12345,
          fromAddress: '0xabcdef1234567890',
          toAddress: '0x1234567890abcdef',
        })
      );
    });

    it('should handle duplicate webhook gracefully', async () => {
      // Mock existing webhook log (duplicate)
      mockWebhookLogRepository.findOne.mockResolvedValue(mockWebhookLog);
      
      // Mock webhook log creation
      mockWebhookLogRepository.create.mockReturnValue(mockWebhookLog);
      mockWebhookLogRepository.save.mockResolvedValue(mockWebhookLog);

      const result = await service.processWebhook(mockPayload, mockHeaders, 'stripe');

      expect(result).toEqual({
        success: true,
        message: 'Webhook already processed',
        paymentId: 'test-payment-123',
        isDuplicate: true,
      });

      expect(mockPaymentRepository.findOne).not.toHaveBeenCalled();
      expect(mockPaymentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      // Mock no existing webhook log
      mockWebhookLogRepository.findOne.mockResolvedValue(null);
      
      // Mock payment not found
      mockPaymentRepository.findOne.mockResolvedValue(null);
      
      // Mock webhook log creation
      mockWebhookLogRepository.create.mockReturnValue(mockWebhookLog);
      mockWebhookLogRepository.save.mockResolvedValue(mockWebhookLog);

      await expect(service.processWebhook(mockPayload, mockHeaders, 'stripe'))
        .rejects.toThrow(NotFoundException);

      expect(mockWebhookLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          processed: false,
          errorMessage: 'Payment with ID test-payment-123 not found',
        })
      );
    });

    it('should throw BadRequestException for invalid webhook status', async () => {
      const invalidPayload = { ...mockPayload, status: 'invalid-status' as WebhookStatus };
      
      // Mock no existing webhook log
      mockWebhookLogRepository.findOne.mockResolvedValue(null);
      
      // Mock payment found
      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      
      // Mock webhook log creation
      mockWebhookLogRepository.create.mockReturnValue(mockWebhookLog);
      mockWebhookLogRepository.save.mockResolvedValue(mockWebhookLog);

      await expect(service.processWebhook(invalidPayload, mockHeaders, 'stripe'))
        .rejects.toThrow(BadRequestException);

      expect(mockWebhookLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          processed: false,
          errorMessage: 'Invalid webhook status: invalid-status',
        })
      );
    });

    it('should handle failed status correctly', async () => {
      const failedPayload = { ...mockPayload, status: WebhookStatus.FAILED };
      
      // Mock no existing webhook log
      mockWebhookLogRepository.findOne.mockResolvedValue(null);
      
      // Mock payment found
      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      
      // Mock webhook log creation
      mockWebhookLogRepository.create.mockReturnValue(mockWebhookLog);
      mockWebhookLogRepository.save.mockResolvedValue(mockWebhookLog);
      
      // Mock payment save
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const result = await service.processWebhook(failedPayload, mockHeaders, 'stripe');

      expect(result.success).toBe(true);
      expect(mockPaymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.FAILED,
        })
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for unknown providers', async () => {
      const result = await service.verifyWebhookSignature('payload', 'signature', 'unknown-provider');
      expect(result).toBe(true);
    });

    it('should handle stripe signature verification', async () => {
      const result = await service.verifyWebhookSignature('payload', 'signature', 'stripe');
      expect(result).toBe(true);
    });

    it('should handle walletconnect signature verification', async () => {
      const result = await service.verifyWebhookSignature('payload', 'signature', 'walletconnect');
      expect(result).toBe(true);
    });
  });

  describe('extractProviderFromHeaders', () => {
    it('should extract stripe provider from headers', () => {
      const headers = { 'stripe-signature': 'test-signature' };
      const provider = service.extractProviderFromHeaders(headers);
      expect(provider).toBe('stripe');
    });

    it('should extract walletconnect provider from headers', () => {
      const headers = { 'x-walletconnect-signature': 'test-signature' };
      const provider = service.extractProviderFromHeaders(headers);
      expect(provider).toBe('walletconnect');
    });

    it('should extract custom provider from headers', () => {
      const headers = { 'x-provider': 'custom-provider' };
      const provider = service.extractProviderFromHeaders(headers);
      expect(provider).toBe('custom-provider');
    });

    it('should return unknown for unrecognized headers', () => {
      const headers = { 'user-agent': 'test-client' };
      const provider = service.extractProviderFromHeaders(headers);
      expect(provider).toBe('unknown');
    });
  });

  describe('getWebhookLogs', () => {
    it('should return webhook logs with filters', async () => {
      const mockLogs = [mockWebhookLog];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      jest.spyOn(webhookLogRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getWebhookLogs('test-payment-123', 'stripe', 10);

      expect(result).toEqual(mockLogs);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('log.paymentId = :paymentId', { paymentId: 'test-payment-123' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.provider = :provider', { provider: 'stripe' });
    });
  });
}); 