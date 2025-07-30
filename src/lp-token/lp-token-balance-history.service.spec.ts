import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LpTokenService } from './lp-token.service';
import { LPToken } from './lp-token.entity';
import { LPTokenEvent } from './lp-token-event.entity';
import { LpBalanceHistoryQueryDto } from './dtos/lp-balance-history-query.dto';

describe('LpTokenService - Balance History', () => {
  let service: LpTokenService;
  let lpTokenRepo: Repository<LPToken>;
  let lpTokenEventRepo: Repository<LPTokenEvent>;

  const mockLpTokenRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockLpTokenEventRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LpTokenService,
        {
          provide: getRepositoryToken(LPToken),
          useValue: mockLpTokenRepo,
        },
        {
          provide: getRepositoryToken(LPTokenEvent),
          useValue: mockLpTokenEventRepo,
        },
      ],
    }).compile();

    service = module.get<LpTokenService>(LpTokenService);
    lpTokenRepo = module.get<Repository<LPToken>>(getRepositoryToken(LPToken));
    lpTokenEventRepo = module.get<Repository<LPTokenEvent>>(getRepositoryToken(LPTokenEvent));
  });

  describe('getBalanceHistory', () => {
    const userId = 'test-user-id';
    const mockEvents = [
      {
        id: 1,
        userAddress: userId,
        amount: 100,
        eventType: 'mint' as const,
        timestamp: new Date('2025-01-01T00:00:00Z'),
        transactionReference: 'tx1',
      },
      {
        id: 2,
        userAddress: userId,
        amount: 50,
        eventType: 'mint' as const,
        timestamp: new Date('2025-01-02T00:00:00Z'),
        transactionReference: 'tx2',
      },
      {
        id: 3,
        userAddress: userId,
        amount: 25,
        eventType: 'burn' as const,
        timestamp: new Date('2025-01-03T00:00:00Z'),
        transactionReference: 'tx3',
      },
    ];

    const mockTokens = [
      { userId, amount: 125, tokenId: 'token1', poolId: 1 },
    ];

    beforeEach(() => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockEvents),
      };

      mockLpTokenEventRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockLpTokenRepo.find.mockResolvedValue(mockTokens);
    });

    it('should return balance history with daily intervals', async () => {
      const query: LpBalanceHistoryQueryDto = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-03T23:59:59Z',
        interval: 'daily',
      };

      const result = await service.getBalanceHistory(userId, query);

      expect(result).toEqual({
        userId,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-03T23:59:59Z',
        interval: 'daily',
        history: expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(String),
            balance: expect.any(String),
          }),
        ]),
        totalPoints: expect.any(Number),
        currentBalance: '125.00000000',
      });
    });

    it('should return empty history when no events found', async () => {
      const emptyQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockLpTokenEventRepo.createQueryBuilder.mockReturnValue(emptyQueryBuilder);

      const query: LpBalanceHistoryQueryDto = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-03T23:59:59Z',
        interval: 'daily',
      };

      const result = await service.getBalanceHistory(userId, query);

      expect(result.history).toEqual([]);
      expect(result.totalPoints).toBe(0);
      expect(result.currentBalance).toBe('125.00000000');
    });

    it('should handle weekly intervals', async () => {
      const query: LpBalanceHistoryQueryDto = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-14T23:59:59Z',
        interval: 'weekly',
      };

      const result = await service.getBalanceHistory(userId, query);

      expect(result.interval).toBe('weekly');
      expect(result.history.length).toBeGreaterThan(0);
    });

    it('should handle monthly intervals', async () => {
      const query: LpBalanceHistoryQueryDto = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-03-31T23:59:59Z',
        interval: 'monthly',
      };

      const result = await service.getBalanceHistory(userId, query);

      expect(result.interval).toBe('monthly');
      expect(result.history.length).toBeGreaterThan(0);
    });

    it('should calculate balance correctly from events', async () => {
      const query: LpBalanceHistoryQueryDto = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-04T00:00:00Z',
        interval: 'daily',
      };

      const result = await service.getBalanceHistory(userId, query);

      // Should have processed: +100 (mint) +50 (mint) -25 (burn) = 125
      const lastPoint = result.history[result.history.length - 1];
      expect(parseFloat(lastPoint.balance)).toBe(125);
    });
  });

  describe('getCurrentBalance', () => {
    it('should calculate current balance from active tokens', async () => {
      const userId = 'test-user-id';
      const mockTokens = [
        { userId, amount: 100, tokenId: 'token1', poolId: 1 },
        { userId, amount: 50, tokenId: 'token2', poolId: 1 },
      ];

      mockLpTokenRepo.find.mockResolvedValue(mockTokens);

      // Use reflection to access private method for testing
      const currentBalance = await (service as any).getCurrentBalance(userId);

      expect(currentBalance).toBe(150);
      expect(mockLpTokenRepo.find).toHaveBeenCalledWith({ where: { userId } });
    });

    it('should return 0 when user has no tokens', async () => {
      const userId = 'test-user-id';
      mockLpTokenRepo.find.mockResolvedValue([]);

      const currentBalance = await (service as any).getCurrentBalance(userId);

      expect(currentBalance).toBe(0);
    });
  });
});
