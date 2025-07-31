import { Test, TestingModule } from '@nestjs/testing';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { NotificationResponseDto } from './dto/notification.dto';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let notificationService: NotificationService;

  const mockNotificationService = {
    getUnreadCount: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const mockSocket = {
    id: 'socket-123',
    handshake: {
      auth: { userId: 'user-123' },
    },
    join: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
    notificationService = module.get<NotificationService>(NotificationService);

    // Set the server property
    (gateway as any).server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should handle client connection and store user mapping', () => {
      gateway.handleConnection(mockSocket as any);

      expect(gateway['connectedUsers'].get('user-123')).toBe('socket-123');
    });

    it('should handle connection without userId', () => {
      const socketWithoutUser = {
        id: 'socket-456',
        handshake: { auth: {} },
      };

      gateway.handleConnection(socketWithoutUser as any);

      expect(gateway['connectedUsers'].size).toBe(0);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove user from connected users on disconnect', () => {
      // First connect
      gateway.handleConnection(mockSocket as any);
      expect(gateway['connectedUsers'].has('user-123')).toBe(true);

      // Then disconnect
      gateway.handleDisconnect(mockSocket as any);
      expect(gateway['connectedUsers'].has('user-123')).toBe(false);
    });
  });

  describe('handleJoin', () => {
    it('should handle join event and send unread count', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(5);

      await gateway.handleJoin(mockSocket as any, { userId: 'user-123' });

      expect(mockSocket.join).toHaveBeenCalledWith('user_user-123');
      expect(mockServer.to).toHaveBeenCalledWith('socket-123');
      expect(mockServer.emit).toHaveBeenCalledWith('unreadCount', { count: 5 });
    });

    it('should not process join without userId', async () => {
      await gateway.handleJoin(mockSocket as any, {});

      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(mockNotificationService.getUnreadCount).not.toHaveBeenCalled();
    });
  });

  describe('handleMarkAsRead', () => {
    it('should handle mark as read event', async () => {
      mockNotificationService.markAsRead.mockResolvedValue({});
      mockNotificationService.getUnreadCount.mockResolvedValue(3);

      await gateway.handleMarkAsRead(mockSocket as any, { notificationId: 'notification-123' });

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notification-123', 'user-123');
      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-123');
    });
  });

  describe('handleMarkAllAsRead', () => {
    it('should handle mark all as read event', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue(undefined);
      mockNotificationService.getUnreadCount.mockResolvedValue(0);

      await gateway.handleMarkAllAsRead(mockSocket as any, { userId: 'user-123' });

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('user-123');
      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-123');
    });
  });

  describe('sendNotificationToUser', () => {
    const mockNotification: NotificationResponseDto = {
      id: 'notification-123',
      userId: 'user-123',
      type: 'CLAIM_APPROVED' as any,
      title: 'Claim Approved',
      message: 'Your claim has been approved.',
      status: 'UNREAD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should send notification to connected user', async () => {
      // Setup connected user
      gateway['connectedUsers'].set('user-123', 'socket-123');

      await gateway.sendNotificationToUser('user-123', mockNotification);

      expect(mockServer.to).toHaveBeenCalledWith('socket-123');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        type: 'notification',
        data: mockNotification,
      });
    });

    it('should handle user not connected gracefully', async () => {
      await gateway.sendNotificationToUser('user-456', mockNotification);

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('sendNotificationToAll', () => {
    const mockNotification: NotificationResponseDto = {
      id: 'notification-123',
      userId: 'user-123',
      type: 'SYSTEM_ALERT' as any,
      title: 'System Alert',
      message: 'System maintenance scheduled.',
      status: 'UNREAD' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should send notification to all connected users', () => {
      gateway.sendNotificationToAll(mockNotification);

      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        type: 'notification',
        data: mockNotification,
      });
    });
  });

  describe('sendUnreadCount', () => {
    it('should send unread count to connected user', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(7);
      gateway['connectedUsers'].set('user-123', 'socket-123');

      await gateway.sendUnreadCount('user-123');

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-123');
      expect(mockServer.to).toHaveBeenCalledWith('socket-123');
      expect(mockServer.emit).toHaveBeenCalledWith('unreadCount', { count: 7 });
    });

    it('should not send unread count to disconnected user', async () => {
      await gateway.sendUnreadCount('user-456');

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user-456');
      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('getConnectedUsersCount', () => {
    it('should return correct connected users count', () => {
      gateway['connectedUsers'].set('user-1', 'socket-1');
      gateway['connectedUsers'].set('user-2', 'socket-2');

      const count = gateway.getConnectedUsersCount();

      expect(count).toBe(2);
    });
  });

  describe('isUserConnected', () => {
    it('should return true for connected user', () => {
      gateway['connectedUsers'].set('user-123', 'socket-123');

      const isConnected = gateway.isUserConnected('user-123');

      expect(isConnected).toBe(true);
    });

    it('should return false for disconnected user', () => {
      const isConnected = gateway.isUserConnected('user-456');

      expect(isConnected).toBe(false);
    });
  });

  describe('getUserIdFromSocket', () => {
    it('should return userId for connected socket', () => {
      gateway['connectedUsers'].set('user-123', 'socket-123');

      const userId = gateway['getUserIdFromSocket'](mockSocket as any);

      expect(userId).toBe('user-123');
    });

    it('should return null for unknown socket', () => {
      const userId = gateway['getUserIdFromSocket']({ id: 'unknown-socket' } as any);

      expect(userId).toBeNull();
    });
  });
}); 