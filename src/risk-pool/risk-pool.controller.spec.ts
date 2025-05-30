import { Test, TestingModule } from '@nestjs/testing';
import { RiskPoolController } from './risk-pool.controller';
import { RiskPoolService } from './risk-pool.service';
import { CreateRiskPoolDto } from './dto/create-risk-pool.dto';
import { UpdateRiskPoolDto } from './dto/update-risk-pool.dto';

describe('RiskPoolController', () => {
  let controller: RiskPoolController;
  let service: RiskPoolService;

  const mockRiskPoolService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskPoolController],
      providers: [
        {
          provide: RiskPoolService,
          useValue: mockRiskPoolService,
        },
      ],
    }).compile();

    controller = module.get<RiskPoolController>(RiskPoolController);
    service = module.get<RiskPoolService>(RiskPoolService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a risk pool', async () => {
      const createRiskPoolDto: CreateRiskPoolDto = {
        name: 'Pool 1',
        token: 'ETH',
        activeCoverage: 1000,
        apy: 5,
      };
      const createdPool = { id: 1, ...createRiskPoolDto, totalLiquidity: 0, createdAt: new Date(), updatedAt: new Date() };

      mockRiskPoolService.create.mockResolvedValue(createdPool);

      const result = await controller.create(createRiskPoolDto);
      expect(result).toEqual(createdPool);
      expect(mockRiskPoolService.create).toHaveBeenCalledWith(createRiskPoolDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of risk pools', async () => {
      const pools = [
        { id: 1, name: 'Pool 1', token: 'ETH', totalLiquidity: 0, activeCoverage: 1000, apy: 5, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockRiskPoolService.findAll.mockResolvedValue(pools);

      const result = await controller.findAll();
      expect(result).toEqual(pools);
      expect(mockRiskPoolService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a risk pool', async () => {
      const pool = { id: 1, name: 'Pool 1', token: 'ETH', totalLiquidity: 0, activeCoverage: 1000, apy: 5, createdAt: new Date(), updatedAt: new Date() };
      mockRiskPoolService.findOne.mockResolvedValue(pool);

      const result = await controller.findOne(1);
      expect(result).toEqual(pool);
      expect(mockRiskPoolService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a risk pool', async () => {
      const updateRiskPoolDto: UpdateRiskPoolDto = { apy: 6 };
      const updatedPool = { id: 1, name: 'Pool 1', token: 'ETH', totalLiquidity: 0, activeCoverage: 1000, apy: 6, createdAt: new Date(), updatedAt: new Date() };

      mockRiskPoolService.update.mockResolvedValue(updatedPool);

      const result = await controller.update(1, updateRiskPoolDto);
      expect(result).toEqual(updatedPool);
      expect(mockRiskPoolService.update).toHaveBeenCalledWith(1, updateRiskPoolDto);
    });
  });
});
