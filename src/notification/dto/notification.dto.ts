import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { NotificationType, NotificationStatus } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to receive notification' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiProperty({ description: 'Notification status', enum: NotificationStatus })
  status: NotificationStatus;

  @ApiProperty({ description: 'Additional metadata', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Read timestamp', required: false })
  readAt?: Date;

  @ApiProperty({ description: 'Sent timestamp', required: false })
  sentAt?: Date;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Notification status', enum: NotificationStatus })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;
}

export class NotificationQueryDto {
  @ApiProperty({ description: 'Filter by status', enum: NotificationStatus, required: false })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({ description: 'Filter by type', enum: NotificationType, required: false })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ description: 'Page number', required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false })
  @IsOptional()
  limit?: number;
}

export class WebSocketNotificationEvent {
  @ApiProperty({ description: 'Event type' })
  type: 'notification';

  @ApiProperty({ description: 'Notification data' })
  data: NotificationResponseDto;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'Notification ID' })
  @IsUUID()
  notificationId: string;
}

export class MarkAllAsReadDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;
} 