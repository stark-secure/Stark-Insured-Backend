import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  UpdateNotificationDto,
  NotificationQueryDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private notificationGateway: NotificationGateway,
  ) {}

  /**
   * Create and send a notification
   */
  async createNotification(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      status: NotificationStatus.UNREAD,
      sentAt: new Date(),
    });

    const savedNotification = await this.notificationRepository.save(notification);
    this.logger.log(`Created notification for user ${createNotificationDto.userId}: ${createNotificationDto.type}`);

    const responseDto = this.mapToResponseDto(savedNotification);

    // Send real-time notification
    await this.notificationGateway.sendNotificationToUser(createNotificationDto.userId, responseDto);

    return responseDto;
  }

  /**
   * Create notification for multiple users
   */
  async createNotificationForUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<NotificationResponseDto[]> {
    const notifications = userIds.map(userId =>
      this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        metadata,
        status: NotificationStatus.UNREAD,
        sentAt: new Date(),
      }),
    );

    const savedNotifications = await this.notificationRepository.save(notifications);
    this.logger.log(`Created ${notifications.length} notifications of type: ${type}`);

    const responseDtos = savedNotifications.map(notification => this.mapToResponseDto(notification));

    // Send real-time notifications to connected users
    for (let i = 0; i < userIds.length; i++) {
      await this.notificationGateway.sendNotificationToUser(userIds[i], responseDtos[i]);
    }

    return responseDtos;
  }

  /**
   * Get notifications for a user with pagination and filters
   */
  async getUserNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{ notifications: NotificationResponseDto[]; total: number }> {
    const { status, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Notification> = { userId };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      notifications: notifications.map(notification => this.mapToResponseDto(notification)),
      total,
    };
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(notificationId: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    return this.mapToResponseDto(notification);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    const updatedNotification = await this.notificationRepository.save(notification);
    this.logger.log(`Marked notification ${notificationId} as read for user ${userId}`);

    return this.mapToResponseDto(updatedNotification);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() },
    );

    this.logger.log(`Marked all notifications as read for user ${userId}`);
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({ id: notificationId, userId });

    if (result.affected === 0) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    this.logger.log(`Deleted notification ${notificationId} for user ${userId}`);
  }

  /**
   * Get notifications by date range
   */
  async getNotificationsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.find({
      where: {
        userId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });

    return notifications.map(notification => this.mapToResponseDto(notification));
  }

  /**
   * Send system-wide notification
   */
  async sendSystemNotification(
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // This would typically send to all users or specific user groups
    // For now, we'll log it and could extend to send to all connected users
    this.logger.log(`System notification: ${title} - ${message}`);
    
    // You could implement logic to send to all users here
    // const allUsers = await this.userService.getAllUserIds();
    // await this.createNotificationForUsers(allUsers, NotificationType.SYSTEM_ALERT, title, message, metadata);
  }

  /**
   * Map notification entity to response DTO
   */
  private mapToResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      metadata: notification.metadata,
      readAt: notification.readAt,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    read: number;
    byType: Record<NotificationType, number>;
  }> {
    const [total, unread] = await Promise.all([
      this.notificationRepository.count({ where: { userId } }),
      this.notificationRepository.count({ where: { userId, status: NotificationStatus.UNREAD } }),
    ]);

    const read = total - unread;

    // Get count by type
    const byTypeQuery = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('notification.userId = :userId', { userId })
      .groupBy('notification.type')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {} as Record<NotificationType, number>);

    return { total, unread, read, byType };
  }
} 