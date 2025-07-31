import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  UpdateNotificationDto,
  NotificationQueryDto,
  MarkAsReadDto,
  MarkAllAsReadDto,
} from './dto/notification.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notification created successfully', type: NotificationResponseDto })
  async createNotification(@Body(ValidationPipe) createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications with filters and pagination' })
  @ApiQuery({ name: 'status', required: false, enum: ['UNREAD', 'READ', 'ARCHIVED'], description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, enum: ['CLAIM_APPROVED', 'CLAIM_REJECTED', 'POLICY_CREATED', 'PAYMENT_RECEIVED'], description: 'Filter by type' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notifications retrieved successfully' })
  async getUserNotifications(
    @Request() req,
    @Query(ValidationPipe) query: NotificationQueryDto,
  ): Promise<{ notifications: NotificationResponseDto[]; total: number }> {
    const userId = req.user.id;
    return this.notificationService.getUserNotifications(userId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics for user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getNotificationStats(@Request() req) {
    const userId = req.user.id;
    return this.notificationService.getNotificationStats(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req): Promise<{ count: number }> {
    const userId = req.user.id;
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification retrieved successfully', type: NotificationResponseDto })
  async getNotificationById(@Param('id') id: string, @Request() req): Promise<NotificationResponseDto> {
    const userId = req.user.id;
    return this.notificationService.getNotificationById(id, userId);
  }

  @Put(':id/mark-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification marked as read', type: NotificationResponseDto })
  async markAsRead(@Param('id') id: string, @Request() req): Promise<NotificationResponseDto> {
    const userId = req.user.id;
    return this.notificationService.markAsRead(id, userId);
  }

  @Put('mark-all-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req): Promise<void> {
    const userId = req.user.id;
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Notification deleted successfully' })
  async deleteNotification(@Param('id') id: string, @Request() req): Promise<void> {
    const userId = req.user.id;
    return this.notificationService.deleteNotification(id, userId);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get notifications by date range' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notifications retrieved successfully' })
  async getNotificationsByDateRange(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<NotificationResponseDto[]> {
    const userId = req.user.id;
    return this.notificationService.getNotificationsByDateRange(
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }
} 