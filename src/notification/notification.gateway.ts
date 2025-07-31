import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { NotificationResponseDto } from './dto/notification.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly notificationService: NotificationService) {}

  afterInit(server: Server) {
    this.logger.log('Notification Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Extract user ID from handshake auth
    const userId = client.handshake.auth.userId;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove user from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: { userId: string }) {
    const { userId } = payload;
    
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      client.join(`user_${userId}`);
      this.logger.log(`User ${userId} joined notification room`);
      
      // Send unread notifications count
      this.sendUnreadCount(userId);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, payload: { notificationId: string }) {
    const { notificationId } = payload;
    const userId = this.getUserIdFromSocket(client);
    
    if (userId) {
      await this.notificationService.markAsRead(notificationId, userId);
      this.sendUnreadCount(userId);
    }
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(client: Socket, payload: { userId: string }) {
    const { userId } = payload;
    
    if (userId) {
      await this.notificationService.markAllAsRead(userId);
      this.sendUnreadCount(userId);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(userId: string, notification: NotificationResponseDto) {
    const socketId = this.connectedUsers.get(userId);
    
    if (socketId) {
      this.server.to(socketId).emit('notification', {
        type: 'notification',
        data: notification,
      });
      this.logger.log(`Notification sent to user ${userId}`);
    } else {
      this.logger.log(`User ${userId} not connected, notification stored in database`);
    }
  }

  /**
   * Send notification to all connected users
   */
  sendNotificationToAll(notification: NotificationResponseDto) {
    this.server.emit('notification', {
      type: 'notification',
      data: notification,
    });
    this.logger.log('Notification sent to all connected users');
  }

  /**
   * Send unread count to specific user
   */
  async sendUnreadCount(userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    const socketId = this.connectedUsers.get(userId);
    
    if (socketId) {
      this.server.to(socketId).emit('unreadCount', { count });
    }
  }

  /**
   * Get user ID from socket connection
   */
  private getUserIdFromSocket(client: Socket): string | null {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        return userId;
      }
    }
    return null;
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
} 