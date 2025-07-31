import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Logger,
  BadRequestException,
  UseInterceptors,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { WebhookService } from './services/webhook.service';
import { WebhookPayloadDto, WebhookResponseDto } from './dto/webhook.dto';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

@ApiTags('webhooks')
@Controller('payment')
@UseInterceptors(LoggingInterceptor)
@UseFilters(HttpExceptionFilter)
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive payment status updates from external providers',
    description: 'Secure webhook endpoint for receiving asynchronous payment status updates from payment providers like Stripe, WalletConnect, and crypto bridges.',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe webhook signature (if using Stripe)',
    required: false,
  })
  @ApiHeader({
    name: 'x-walletconnect-signature',
    description: 'WalletConnect webhook signature (if using WalletConnect)',
    required: false,
  })
  @ApiHeader({
    name: 'x-provider',
    description: 'Provider name for webhook processing',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid webhook payload or signature',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async receiveWebhook(
    @Body(ValidationPipe) payload: WebhookPayloadDto,
    @Headers() headers: Record<string, string>,
  ): Promise<WebhookResponseDto> {
    this.logger.log(`Received webhook for payment ${payload.paymentId}`);

    try {
      // Extract provider from headers
      const provider = this.webhookService.extractProviderFromHeaders(headers);

      // Optional: Verify webhook signature if provider supports it
      const signature = headers['stripe-signature'] || headers['x-walletconnect-signature'];
      if (signature) {
        const isValid = await this.webhookService.verifyWebhookSignature(
          JSON.stringify(payload),
          signature,
          provider,
        );
        if (!isValid) {
          throw new BadRequestException('Invalid webhook signature');
        }
      }

      // Process the webhook
      const result = await this.webhookService.processWebhook(payload, headers, provider);

      this.logger.log(`Webhook processed successfully for payment ${payload.paymentId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('webhook/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test webhook endpoint',
    description: 'Test endpoint for webhook functionality with sample data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test webhook processed successfully',
    type: WebhookResponseDto,
  })
  async testWebhook(
    @Body(ValidationPipe) payload: WebhookPayloadDto,
  ): Promise<WebhookResponseDto> {
    this.logger.log(`Testing webhook with payment ${payload.paymentId}`);

    const testHeaders = {
      'x-provider': 'test',
      'user-agent': 'test-client',
    };

    return this.webhookService.processWebhook(payload, testHeaders, 'test');
  }
} 