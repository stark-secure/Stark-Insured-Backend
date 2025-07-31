import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/notification.dto';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: Repository<Notification>;
  let notificationGateway: NotificationGateway;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockNotificationGateway = {
    sendNotificationToUser: jest.fn(),
    sendNotificationToAll: jest.fn(),
    sendUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: NotificationGateway,
          useValue: mockNotificationGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    notificationGateway = module.get<NotificationGateway>(NotificationGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    const createNotificationDto: CreateNotificationDto = {
      userId: 'user-123',
      type: NotificationType.CLAIM_APPROVED,
      title: 'Claim Approved',
      message: 'Your claim has been approved.',
    };

    const mockNotification: Notification = {
      id: 'notification-123',
      userId: 'user-123',
      type: NotificationType.CLAIM_APPROVED,
      title: 'Claim Approved',
      message: 'Your claim has been approved.',
      status: NotificationStatus.UNREAD,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Notification;

    it('should create and send a notification successfully', async () => {
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockNotificationGateway.sendNotificationToUser.mockResolvedValue(undefined);

      const result = await service.createNotification(createNotificationDto);

      expect(result).toEqual({
        id: 'notification-123',
        userId: 'user-123',
        type: NotificationType.CLAIM_APPROVED,
        title: 'Claim Approved',
        message: 'Your claim has been approved.',
        status: NotificationStatus.UNREAD,
        createdAt: mockNotification.createdAt,
        updatedAt: mockNotification.updatedAt,
      });

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        ...createNotificationDto,
        status: NotificationStatus.UNREAD,
        sentAt: expect.any(Date),
      });

      expect(mockNotificationGateway.sendNotificationToUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          id: 'notification-123',
          userId: 'user-123',
          type: NotificationType.CLAIM_APPROVED,
        }),
      );
    });
  });

  describe('createNotificationForUsers', () => {
    const userIds = ['user-1', 'user-2'];
    const type = NotificationType.POLICY_CREATED;
    const title = 'Policy Created';
    const message = 'Your policy has been created.';

    const mockNotifications = userIds.map((userId, index) => ({
      id: `notification-${index + 1}`,
      userId,
      type,
      title,
      message,
      status: NotificationStatus.UNREAD,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as Notification[];

    it('should create notifications for multiple users', async () => {
      mockNotificationRepository.create.mockImplementation((data) => ({
        ...data,
        id: `notification-${Math.random()}`,
      }));
      mockNotificationRepository.save.mockResolvedValue(mockNotifications);
      mockNotificationGateway.sendNotificationToUser.mockResolvedValue(undefined);

      const result = await service.createNotificationForUsers(userIds, type, title, message);

      expect(result).toHaveLength(2);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ userId: 'user-1' }),
        expect.objectContaining({ userId: 'user-2' }),
      ]));
    });
  });

  describe('getUserNotifications', () => {
    const userId = 'user-123';
    const query = { page: 1, limit: 10 };

    const mockNotifications = [
      {
        id: 'notification-1',
        userId: 'user-123',
        type: NotificationType.CLAIM_APPROVED,
        title: 'Claim Approved',
        message: 'Your claim has been approved.',
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as Notification[];

    it('should get user notifications with pagination', async () => {
      mockNotificationRepository.findAndCount.mockResolvedValue([mockNotifications, 1]);

      const result = await service.getUserNotifications(userId, query);

      expect(result).toEqual({
        notifications: expect.arrayContaining([
          expect.objectContaining({
            id: 'notification-1',
            userId: 'user-123',
          }),
        ]),
        total: 1,
      });

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const queryWithFilters = { ...query, status: NotificationStatus.UNREAD, type: NotificationType.CLAIM_APPROVED };
      mockNotificationRepository.findAndCount.mockResolvedValue([mockNotifications, 1]);

      await service.getUserNotifications(userId, queryWithFilters);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          status: NotificationStatus.UNREAD,
          type: NotificationType.CLAIM_APPROVED,
        },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('markAsRead', () => {
    const notificationId = 'notification-123';
    const userId = 'user-123';

    const mockNotification: Notification = {
      id: notificationId,
      userId,
      type: NotificationType.CLAIM_APPROVED,
      title: 'Claim Approved',
      message: 'Your claim has been approved.',
      status: NotificationStatus.UNREAD,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Notification;

    it('should mark notification as read', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.READ,
        readAt: new Date(),
      });

      const result = await service.markAsRead(notificationId, userId);

      expect(result.status).toBe(NotificationStatus.READ);
      expect(result.readAt).toBeDefined();
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    const userId = 'user-123';

    it('should mark all notifications as read', async () => {
      mockNotificationRepository.update.mockResolvedValue({ affected: 5 });

      await service.markAllAsRead(userId);

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { userId, status: NotificationStatus.UNREAD },
        { status: NotificationStatus.READ, readAt: expect.any(Date) },
      );
    });
  });

  describe('getUnreadCount', () => {
    const userId = 'user-123';

    it('should return unread count', async () => {
      mockNotificationRepository.count.mockResolvedValue(3);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(3);
      expect(mockNotificationRepository.count).toHaveBeenCalledWith({
        where: { userId, status: NotificationStatus.UNREAD },
      });
    });
  });

  describe('deleteNotification', () => {
    const notificationId = 'notification-123';
    const userId = 'user-123';

    it('should delete notification successfully', async () => {
      mockNotificationRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteNotification(notificationId, userId);

      expect(mockNotificationRepository.delete).toHaveBeenCalledWith({
        id: notificationId,
        userId,
      });
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deleteNotification(notificationId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNotificationStats', () => {
    const userId = 'user-123';

    it('should return notification statistics', async () => {
      mockNotificationRepository.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3); // unread

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: NotificationType.CLAIM_APPROVED, count: '5' },
          { type: NotificationType.POLICY_CREATED, count: '3' },
        ]),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getNotificationStats(userId);

      expect(result).toEqual({
        total: 10,
        unread: 3,
        read: 7,
        byType: {
          [NotificationType.CLAIM_APPROVED]: 5,
          [NotificationType.POLICY_CREATED]: 3,
        },
      });
    });
  });
}); 