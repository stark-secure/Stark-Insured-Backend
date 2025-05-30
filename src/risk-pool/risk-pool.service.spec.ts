import { Test, TestingModule } from '@nestjs/testing';
import { RiskPoolService } from './risk-pool.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RiskPool } from './entities/risk-pool.entity';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockRiskPool = {
  id: 1,
  name: 'Pool 1',
  token: 'ETH',
  totalLiquidity: 0,
  activeCoverage: 1000,
  apy: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RiskPoolService', () => {
  let service: RiskPoolService;
  let repo: Repository<RiskPool>;

  const mockRepo = {
    create: jest.fn().mockImplementation(dto => ({ ...dto })),
    save: jest.fn().mockImplementation(pool => Promise.resolve({ ...mockRiskPool, ...pool })),
    find: jest.fn().mockResolvedValue([mockRiskPool]),
    findOne: jest.fn().mockImplementation(({ where: { id } }) =>
      id === mockRiskPool.id ? Promise.resolve(mockRiskPool) : Promise.resolve(null)
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskPoolService,
        {
          provide: getRepositoryToken(RiskPool),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<RiskPoolService>(RiskPoolService);
    repo = module.get<Repository<RiskPool>>(getRepositoryToken(RiskPool));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a risk pool', async () => {
      const dto = { name: 'Pool 1', token: 'ETH', activeCoverage: 1000, apy: 5 };
      const result = await service.create(dto as any);
      expect(repo.create).toHaveBeenCalledWith({ ...dto, totalLiquidity: 0 });
      expect(repo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('findAll', () => {
    it('should return all risk pools', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockRiskPool]);
      expect(repo.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a risk pool by id', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockRiskPool);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if not found', async () => {
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a risk pool', async () => {
      const dto = { apy: 10 };
      const result = await service.update(1, dto as any);
      expect(result.apy).toBe(10);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if totalLiquidity is in dto', async () => {
      await expect(service.update(1, { totalLiquidity: 100 } as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('adjustLiquidity', () => {
    it('should adjust liquidity', async () => {
      const poolCopy = { ...mockRiskPool, totalLiquidity: 500 };
      repo.findOne = jest.fn().mockResolvedValue(poolCopy);
      repo.save = jest.fn().mockImplementation(pool => Promise.resolve(pool));

      const result = await service.adjustLiquidity(1, 500);
      expect(result.totalLiquidity).toBe(1000);
      expect(repo.save).toHaveBeenCalled();
    });
  });
});
