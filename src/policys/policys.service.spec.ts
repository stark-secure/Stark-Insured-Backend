/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePolicyDto } from './dto/create-policy.dto';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Policy, PolicyStatus } from './entities/policy.entity';
import { PolicyService } from './policys.service';

describe('PolicyService', () => {
  let service: PolicyService;
  let repository: Repository<Policy>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        {
          provide: getRepositoryToken(Policy),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
    repository = module.get<Repository<Policy>>(getRepositoryToken(Policy));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new policy successfully', async () => {
      const createPolicyDto: CreatePolicyDto = {
        coverageAmount: 1000,
        premium: 100,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-12-01'),
      };

      const userId = 1;
      const expectedPolicy = { id: 1, ...createPolicyDto, userId };

      mockRepository.create.mockReturnValue(expectedPolicy);
      mockRepository.save.mockResolvedValue(expectedPolicy);

      const result = await service.create(createPolicyDto, userId);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createPolicyDto,
        userId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedPolicy);
      expect(result).toEqual(expectedPolicy);
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const createPolicyDto: CreatePolicyDto = {
        coverageAmount: 1000,
        premium: 100,
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-06-01'),
      };

      await expect(service.create(createPolicyDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when start date is in the past', async () => {
      const createPolicyDto: CreatePolicyDto = {
        coverageAmount: 1000,
        premium: 100,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-01'),
      };

      await expect(service.create(createPolicyDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a policy when found', async () => {
      const policy = {
        id: 1,
        userId: 1,
        coverageAmount: 1000,
        premium: 100,
        status: PolicyStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(policy);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(result).toEqual(policy);
    });

    it('should throw NotFoundException when policy not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own policy', async () => {
      const policy = {
        id: 1,
        userId: 2,
        coverageAmount: 1000,
        premium: 100,
        status: PolicyStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(policy);

      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPoliciesForUser', () => {
    it('should return policies for a user', async () => {
      const policies = [
        { id: 1, userId: 1, status: PolicyStatus.ACTIVE },
        { id: 2, userId: 1, status: PolicyStatus.EXPIRED },
      ];

      mockRepository.find.mockResolvedValue(policies);

      const result = await service.getPoliciesForUser(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(policies);
    });
  });

  describe('cancel', () => {
    it('should cancel an active policy', async () => {
      const policy = {
        id: 1,
        userId: 1,
        status: PolicyStatus.ACTIVE,
      };

      const cancelledPolicy = {
        ...policy,
        status: PolicyStatus.CANCELLED,
      };

      mockRepository.findOne.mockResolvedValue(policy);
      mockRepository.save.mockResolvedValue(cancelledPolicy);

      const result = await service.cancel(1, 1);

      expect(mockRepository.save).toHaveBeenCalledWith(cancelledPolicy);
      expect(result.status).toBe(PolicyStatus.CANCELLED);
    });

    it('should throw BadRequestException when trying to cancel non-active policy', async () => {
      const policy = {
        id: 1,
        userId: 1,
        status: PolicyStatus.EXPIRED,
      };

      mockRepository.findOne.mockResolvedValue(policy);

      await expect(service.cancel(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTotalCoverageForUser', () => {
    it('should return total coverage for user', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '5000.00' }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTotalCoverageForUser(1);

      expect(result).toBe(5000);
    });

    it('should return 0 when no active policies found', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTotalCoverageForUser(1);

      expect(result).toBe(0);
    });
  });
});
