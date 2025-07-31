import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MultiPaymentsModule } from '../src/multi-payments/multi-payments.module';
import { Payment, PaymentStatus } from '../src/multi-payments/entities/payment.entity';
import { WebhookLog } from '../src/multi-payments/entities/webhook-log.entity';
import { WebhookStatus } from '../src/multi-payments/dto/webhook.dto';

describe('Webhook (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'stark_insured_test',
          entities: [Payment, WebhookLog],
          synchronize: true,
          dropSchema: true,
        }),
        MultiPaymentsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /payment/webhook', () => {
    it('should process valid webhook successfully', async () => {
      const webhookPayload = {
        paymentId: 'test-payment-123',
        status: WebhookStatus.SUCCESS,
        amount: 100,
        timestamp: '2025-01-15T10:00:00Z',
        txHash: '0x1234567890abcdef',
        blockNumber: 12345,
        fromAddress: '0xabcdef1234567890',
        toAddress: '0x1234567890abcdef',
      };

      const headers = {
        'x-provider': 'stripe',
        'user-agent': 'test-client',
      };

      const response = await request(app.getHttpServer())
        .post('/payment/webhook')
        .set(headers)
        .send(webhookPayload)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Webhook processed successfully',
        paymentId: 'test-payment-123',
        isDuplicate: false,
      });
    });

    it('should handle duplicate webhook gracefully', async () => {
      const webhookPayload = {
        paymentId: 'test-payment-123',
        status: WebhookStatus.SUCCESS,
        amount: 100,
        timestamp: '2025-01-15T10:00:00Z',
      };

      const headers = {
        'x-provider': 'stripe',
        'user-agent': 'test-client',
      };

      // Send the same webhook twice
      await request(app.getHttpServer())
        .post('/payment/webhook')
        .set(headers)
        .send(webhookPayload)
        .expect(200);

      const response = await request(app.getHttpServer())
        .post('/payment/webhook')
        .set(headers)
        .send(webhookPayload)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Webhook already processed',
        paymentId: 'test-payment-123',
        isDuplicate: true,
      });
    });

    it('should reject invalid webhook payload', async () => {
      const invalidPayload = {
        paymentId: 'test-payment-123',
        // Missing required fields
      };

      const headers = {
        'x-provider': 'stripe',
        'user-agent': 'test-client',
      };

      await request(app.getHttpServer())
        .post('/payment/webhook')
        .set(headers)
        .send(invalidPayload)
        .expect(400);
    });

    it('should handle failed payment status', async () => {
      const webhookPayload = {
        paymentId: 'test-payment-123',
        status: WebhookStatus.FAILED,
        amount: 100,
        timestamp: '2025-01-15T10:00:00Z',
        errorMessage: 'Transaction failed',
      };

      const headers = {
        'x-provider': 'stripe',
        'user-agent': 'test-client',
      };

      const response = await request(app.getHttpServer())
        .post('/payment/webhook')
        .set(headers)
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle pending payment status', async () => {
      const webhookPayload = {
        paymentId: 'test-payment-123',
        status: WebhookStatus.PENDING,
        amount: 100,
        timestamp: '2025-01-15T10:00:00Z',
      };

      const headers = {
        'x-provider': 'stripe',
        'user-agent': 'test-client',
      };

      const response = await request(app.getHttpServer())
        .post('/payment/webhook')
        .set(headers)
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /payment/webhook/test', () => {
    it('should process test webhook successfully', async () => {
      const webhookPayload = {
        paymentId: 'test-payment-123',
        status: WebhookStatus.SUCCESS,
        amount: 100,
        timestamp: '2025-01-15T10:00:00Z',
      };

      const response = await request(app.getHttpServer())
        .post('/payment/webhook/test')
        .send(webhookPayload)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Webhook processed successfully',
        paymentId: 'test-payment-123',
        isDuplicate: false,
      });
    });
  });
}); 