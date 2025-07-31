import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from '../src/notification/notification.module';
import { Notification, NotificationType, NotificationStatus } from '../src/notification/entities/notification.entity';
import { io, Socket } from 'socket.io-client';

describe('Notification (e2e)', () => {
  let app: INestApplication;
  let clientSocket: Socket;

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
          entities: [Notification],
          synchronize: true,
          dropSchema: true,
        }),
        NotificationModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    await app.close();
  });

  describe('WebSocket Connection', () => {
    it('should connect to notification namespace', (done) => {
      clientSocket = io('http://localhost:3000/notifications', {
        auth: { userId: 'test-user-123' },
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    it('should handle join event and receive unread count', (done) => {
      clientSocket = io('http://localhost:3000/notifications', {
        auth: { userId: 'test-user-123' },
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', { userId: 'test-user-123' });
      });

      clientSocket.on('unreadCount', (data) => {
        expect(data).toHaveProperty('count');
        expect(typeof data.count).toBe('number');
        done();
      });
    });
  });

  describe('HTTP Endpoints', () => {
    it('should create a notification via HTTP', async () => {
      const notificationData = {
        userId: 'test-user-123',
        type: NotificationType.CLAIM_APPROVED,
        title: 'Claim Approved',
        message: 'Your claim has been approved.',
      };

      const response = await request(app.getHttpServer())
        .post('/notifications')
        .send(notificationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe('test-user-123');
      expect(response.body.type).toBe(NotificationType.CLAIM_APPROVED);
      expect(response.body.status).toBe(NotificationStatus.UNREAD);
    });

    it('should get user notifications with pagination', async () => {
      // First create a notification
      await request(app.getHttpServer())
        .post('/notifications')
        .send({
          userId: 'test-user-123',
          type: NotificationType.POLICY_CREATED,
          title: 'Policy Created',
          message: 'Your policy has been created.',
        });

      const response = await request(app.getHttpServer())
        .get('/notifications')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    it('should get unread count', async () => {
      // Create an unread notification
      await request(app.getHttpServer())
        .post('/notifications')
        .send({
          userId: 'test-user-123',
          type: NotificationType.PAYMENT_RECEIVED,
          title: 'Payment Received',
          message: 'Payment processed successfully.',
        });

      const response = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    it('should mark notification as read', async () => {
      // Create a notification
      const createResponse = await request(app.getHttpServer())
        .post('/notifications')
        .send({
          userId: 'test-user-123',
          type: NotificationType.CLAIM_APPROVED,
          title: 'Claim Approved',
          message: 'Your claim has been approved.',
        });

      const notificationId = createResponse.body.id;

      // Mark as read
      const response = await request(app.getHttpServer())
        .put(`/notifications/${notificationId}/mark-as-read`)
        .expect(200);

      expect(response.body.status).toBe(NotificationStatus.READ);
      expect(response.body.readAt).toBeDefined();
    });

    it('should mark all notifications as read', async () => {
      // Create multiple notifications
      await request(app.getHttpServer())
        .post('/notifications')
        .send({
          userId: 'test-user-123',
          type: NotificationType.CLAIM_APPROVED,
          title: 'Claim Approved',
          message: 'Your claim has been approved.',
        });

      await request(app.getHttpServer())
        .post('/notifications')
        .send({
          userId: 'test-user-123',
          type: NotificationType.POLICY_CREATED,
          title: 'Policy Created',
          message: 'Your policy has been created.',
        });

      // Mark all as read
      await request(app.getHttpServer())
        .put('/notifications/mark-all-as-read')
        .expect(200);

      // Verify unread count is 0
      const response = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .expect(200);

      expect(response.body.count).toBe(0);
    });

    it('should delete a notification', async () => {
      // Create a notification
      const createResponse = await request(app.getHttpServer())
        .post('/notifications')
        .send({
          userId: 'test-user-123',
          type: NotificationType.SYSTEM_ALERT,
          title: 'System Alert',
          message: 'System maintenance scheduled.',
        });

      const notificationId = createResponse.body.id;

      // Delete the notification
      await request(app.getHttpServer())
        .delete(`/notifications/${notificationId}`)
        .expect(204);
    });
  });

  describe('Real-time Notification Delivery', () => {
    it('should receive real-time notification via WebSocket', (done) => {
      clientSocket = io('http://localhost:3000/notifications', {
        auth: { userId: 'test-user-123' },
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', { userId: 'test-user-123' });
      });

      clientSocket.on('notification', (data) => {
        expect(data).toHaveProperty('type', 'notification');
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('title');
        expect(data.data).toHaveProperty('message');
        done();
      });

      // Create a notification that should trigger WebSocket event
      setTimeout(async () => {
        await request(app.getHttpServer())
          .post('/notifications')
          .send({
            userId: 'test-user-123',
            type: NotificationType.CLAIM_APPROVED,
            title: 'Claim Approved',
            message: 'Your claim has been approved.',
          });
      }, 100);
    });

    it('should handle mark as read via WebSocket', (done) => {
      clientSocket = io('http://localhost:3000/notifications', {
        auth: { userId: 'test-user-123' },
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join', { userId: 'test-user-123' });
      });

      clientSocket.on('unreadCount', (data) => {
        expect(data).toHaveProperty('count');
        done();
      });

      // Create and mark notification as read
      setTimeout(async () => {
        const createResponse = await request(app.getHttpServer())
          .post('/notifications')
          .send({
            userId: 'test-user-123',
            type: NotificationType.CLAIM_APPROVED,
            title: 'Claim Approved',
            message: 'Your claim has been approved.',
          });

        clientSocket.emit('markAsRead', { notificationId: createResponse.body.id });
      }, 100);
    });
  });
}); 