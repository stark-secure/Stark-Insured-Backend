import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum WebhookStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

export class WebhookPayloadDto {
  @ApiProperty({ description: 'Unique payment identifier' })
  @IsString()
  paymentId: string;

  @ApiProperty({ description: 'Payment status', enum: WebhookStatus })
  @IsEnum(WebhookStatus)
  status: WebhookStatus;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'ISO timestamp of the webhook event' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Transaction hash (optional)', required: false })
  @IsOptional()
  @IsString()
  txHash?: string;

  @ApiProperty({ description: 'Block number (optional)', required: false })
  @IsOptional()
  @IsNumber()
  blockNumber?: number;

  @ApiProperty({ description: 'From address (optional)', required: false })
  @IsOptional()
  @IsString()
  fromAddress?: string;

  @ApiProperty({ description: 'To address (optional)', required: false })
  @IsOptional()
  @IsString()
  toAddress?: string;

  @ApiProperty({ description: 'Provider-specific metadata (optional)', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Error message if status is failed (optional)', required: false })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class WebhookResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Payment ID that was processed' })
  paymentId: string;

  @ApiProperty({ description: 'Whether this was a duplicate webhook' })
  isDuplicate?: boolean;
}

export class WebhookLogDto {
  @ApiProperty({ description: 'Webhook log ID' })
  id: string;

  @ApiProperty({ description: 'Payment ID' })
  paymentId: string;

  @ApiProperty({ description: 'Webhook status' })
  status: WebhookStatus;

  @ApiProperty({ description: 'Provider name' })
  provider: string;

  @ApiProperty({ description: 'Request headers' })
  headers: Record<string, string>;

  @ApiProperty({ description: 'Request body' })
  body: any;

  @ApiProperty({ description: 'Processing timestamp' })
  processedAt: Date;

  @ApiProperty({ description: 'Whether webhook was processed successfully' })
  processed: boolean;

  @ApiProperty({ description: 'Error message if processing failed' })
  errorMessage?: string;
} 