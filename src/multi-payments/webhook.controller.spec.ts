import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './services/webhook.service';
import { WebhookPayloadDto, WebhookStatus, WebhookResponseDto } from './dto/webhook.dto';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookService: WebhookService;

  const mockWebhookService = {
    extractProviderFromHeaders: jest.fn(),
    verifyWebhookSignature: jest.fn(),
    processWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: WebhookService,
          useValue: mockWebhookService,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    webhookService = module.get<WebhookService>(WebhookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('receiveWebhook', () => {
    const mockPayload: WebhookPayloadDto = {
      paymentId: 'test-payment-123',
      status: WebhookStatus.SUCCESS,
      amount: 100,
      timestamp: '2025-01-15T10:00:00Z',
      txHash: '0x1234567890abcdef',
    };

    const mockHeaders = {
      'user-agent': 'test-provider/1.0',
      'x-provider': 'stripe',
    };

    const mockResponse: WebhookResponseDto = {
      success: true,
      message: 'Webhook processed successfully',
      paymentId: 'test-payment-123',
      isDuplicate: false,
    };

    it('should process webhook successfully', async () => {
      mockWebhookService.extractProviderFromHeaders.mockReturnValue('stripe');
      mockWebhookService.verifyWebhookSignature.mockResolvedValue(true);
      mockWebhookService.processWebhook.mockResolvedValue(mockResponse);

      const result = await controller.receiveWebhook(mockPayload, mockHeaders);

      expect(result).toEqual(mockResponse);
      expect(mockWebhookService.extractProviderFromHeaders).toHaveBeenCalledWith(mockHeaders);
      expect(mockWebhookService.processWebhook).toHaveBeenCalledWith(mockPayload, mockHeaders, 'stripe');
    });

    it('should handle stripe signature verification', async () => {
      const headersWithSignature = {
        ...mockHeaders,
        'stripe-signature': 'test-signature',
      };

      mockWebhookService.extractProviderFromHeaders.mockReturnValue('stripe');
      mockWebhookService.verifyWebhookSignature.mockResolvedValue(true);
      mockWebhookService.processWebhook.mockResolvedValue(mockResponse);

      const result = await controller.receiveWebhook(mockPayload, headersWithSignature);

      expect(result).toEqual(mockResponse);
      expect(mockWebhookService.verifyWebhookSignature).toHaveBeenCalledWith(
        JSON.stringify(mockPayload),
        'test-signature',
        'stripe'
      );
    });

    it('should handle walletconnect signature verification', async () => {
      const headersWithSignature = {
        ...mockHeaders,
        'x-walletconnect-signature': 'test-signature',
      };

      mockWebhookService.extractProviderFromHeaders.mockReturnValue('walletconnect');
      mockWebhookService.verifyWebhookSignature.mockResolvedValue(true);
      mockWebhookService.processWebhook.mockResolvedValue(mockResponse);

      const result = await controller.receiveWebhook(mockPayload, headersWithSignature);

      expect(result).toEqual(mockResponse);
      expect(mockWebhookService.verifyWebhookSignature).toHaveBeenCalledWith(
        JSON.stringify(mockPayload),
        'test-signature',
        'walletconnect'
      );
    });

    it('should throw BadRequestException for invalid signature', async () => {
      mockWebhookService.extractProviderFromHeaders.mockReturnValue('stripe');
      mockWebhookService.verifyWebhookSignature.mockResolvedValue(false);

      await expect(controller.receiveWebhook(mockPayload, mockHeaders))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle service errors', async () => {
      mockWebhookService.extractProviderFromHeaders.mockReturnValue('stripe');
      mockWebhookService.verifyWebhookSignature.mockResolvedValue(true);
      mockWebhookService.processWebhook.mockRejectedValue(new NotFoundException('Payment not found'));

      await expect(controller.receiveWebhook(mockPayload, mockHeaders))
        .rejects.toThrow(NotFoundException);
    });

    it('should handle webhook service errors gracefully', async () => {
      mockWebhookService.extractProviderFromHeaders.mockReturnValue('stripe');
      mockWebhookService.verifyWebhookSignature.mockResolvedValue(true);
      mockWebhookService.processWebhook.mockRejectedValue(new Error('Service error'));

      await expect(controller.receiveWebhook(mockPayload, mockHeaders))
        .rejects.toThrow(Error);
    });
  });

  describe('testWebhook', () => {
    const mockPayload: WebhookPayloadDto = {
      paymentId: 'test-payment-123',
      status: WebhookStatus.SUCCESS,
      amount: 100,
      timestamp: '2025-01-15T10:00:00Z',
    };

    const mockResponse: WebhookResponseDto = {
      success: true,
      message: 'Webhook processed successfully',
      paymentId: 'test-payment-123',
      isDuplicate: false,
    };

    it('should process test webhook successfully', async () => {
      mockWebhookService.processWebhook.mockResolvedValue(mockResponse);

      const result = await controller.testWebhook(mockPayload);

      expect(result).toEqual(mockResponse);
      expect(mockWebhookService.processWebhook).toHaveBeenCalledWith(
        mockPayload,
        {
          'x-provider': 'test',
          'user-agent': 'test-client',
        },
        'test'
      );
    });

    it('should handle test webhook errors', async () => {
      mockWebhookService.processWebhook.mockRejectedValue(new Error('Test error'));

      await expect(controller.testWebhook(mockPayload))
        .rejects.toThrow(Error);
    });
  });
}); 