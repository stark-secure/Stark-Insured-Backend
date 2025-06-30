import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimService } from './claim.service';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { OracleService } from '../oracle/oracle.service';
import { ClaimNotificationService } from './notification.service';
import { UserService } from '../user/user.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ClaimService', () => {
  let service: ClaimService;
  let claimRepository: jest.Mocked<Repository<Claim>>;
  let oracleService: jest.Mocked<OracleService>;
  let notificationService: jest.Mocked<ClaimNotificationService>;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClaim = {
    id: 1,
    type: 'Property Damage',
    description: 'Vehicle damaged due to hail storm',
    status: ClaimStatus.PENDING,
    userId: '1',
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockClaimRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    const mockOracleService = {
      verifyClaim: jest.fn(),
    };

    const mockNotificationService = {
      sendClaimSubmittedNotification: jest.fn(),
      sendClaimStatusNotification: jest.fn(),
      sendClaimProcessingNotification: jest.fn(),
    };

    const mockUserService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimService,
        {
          provide: getRepositoryToken(Claim),
          useValue: mockClaimRepository,
        },
        {
          provide: OracleService,
          useValue: mockOracleService,
        },
        {
          provide: ClaimNotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<ClaimService>(ClaimService);
    claimRepository = module.get(getRepositoryToken(Claim));
    oracleService = module.get(OracleService);
    notificationService = module.get(ClaimNotificationService);
    userService = module.get(UserService);
  });

  describe('create', () => {
    it('should create a claim and send submission notification', async () => {
      const createClaimDto: CreateClaimDto = {
        type: 'Property Damage',
        description: 'Vehicle damaged due to hail storm',
      };

      claimRepository.create.mockReturnValue(mockClaim as any);
      claimRepository.save.mockResolvedValue(mockClaim as any);
      userService.findOne.mockResolvedValue(mockUser as any);
      notificationService.sendClaimSubmittedNotification.mockResolvedValue();

      const result = await service.create(createClaimDto, '1');

      expect(claimRepository.create).toHaveBeenCalledWith({
        ...createClaimDto,
        userId: '1',
      });
      expect(claimRepository.save).toHaveBeenCalled();
      expect(userService.findOne).toHaveBeenCalledWith('1');
      expect(notificationService.sendClaimSubmittedNotification).toHaveBeenCalledWith(
        mockClaim,
        mockUser,
      );
      expect(result).toBeDefined();
    });

    it('should handle notification failure gracefully', async () => {
      const createClaimDto: CreateClaimDto = {
        type: 'Property Damage',
        description: 'Vehicle damaged due to hail storm',
      };

      claimRepository.create.mockReturnValue(mockClaim as any);
      claimRepository.save.mockResolvedValue(mockClaim as any);
      userService.findOne.mockResolvedValue(mockUser as any);
      notificationService.sendClaimSubmittedNotification.mockRejectedValue(new Error('SMTP error'));

      const result = await service.create(createClaimDto, '1');

      expect(result).toBeDefined();
      expect(notificationService.sendClaimSubmittedNotification).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update claim status and send notification', async () => {
      const updateClaimDto: UpdateClaimDto = {
        status: ClaimStatus.APPROVED,
        description: 'Updated description',
      };

      const existingClaim = { ...mockClaim, status: ClaimStatus.PENDING };
      const updatedClaim = { ...existingClaim, status: ClaimStatus.APPROVED };

      claimRepository.findOne.mockResolvedValue(existingClaim as any);
      claimRepository.save.mockResolvedValue(updatedClaim as any);
      notificationService.sendClaimStatusNotification.mockResolvedValue();

      const result = await service.update(1, updateClaimDto, '1', true);

      expect(claimRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(claimRepository.save).toHaveBeenCalled();
      expect(notificationService.sendClaimStatusNotification).toHaveBeenCalledWith({
        claim: updatedClaim,
        user: mockUser,
        previousStatus: ClaimStatus.PENDING,
        newStatus: ClaimStatus.APPROVED,
        remarks: 'Updated description: Updated description',
      });
      expect(result).toBeDefined();
    });

    it('should not send notification when status is not changed', async () => {
      const updateClaimDto: UpdateClaimDto = {
        description: 'Updated description only',
      };

      const existingClaim = { ...mockClaim, status: ClaimStatus.PENDING };

      claimRepository.findOne.mockResolvedValue(existingClaim as any);
      claimRepository.save.mockResolvedValue(existingClaim as any);

      const result = await service.update(1, updateClaimDto, '1', true);

      expect(notificationService.sendClaimStatusNotification).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle notification failure gracefully', async () => {
      const updateClaimDto: UpdateClaimDto = {
        status: ClaimStatus.APPROVED,
      };

      const existingClaim = { ...mockClaim, status: ClaimStatus.PENDING };
      const updatedClaim = { ...existingClaim, status: ClaimStatus.APPROVED };

      claimRepository.findOne.mockResolvedValue(existingClaim as any);
      claimRepository.save.mockResolvedValue(updatedClaim as any);
      notificationService.sendClaimStatusNotification.mockRejectedValue(new Error('SMTP error'));

      const result = await service.update(1, updateClaimDto, '1', true);

      expect(result).toBeDefined();
      expect(notificationService.sendClaimStatusNotification).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-admin tries to update', async () => {
      const updateClaimDto: UpdateClaimDto = {
        status: ClaimStatus.APPROVED,
      };

      claimRepository.findOne.mockResolvedValue(mockClaim as any);

      await expect(service.update(1, updateClaimDto, '1', false)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when claim not found', async () => {
      const updateClaimDto: UpdateClaimDto = {
        status: ClaimStatus.APPROVED,
      };

      claimRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, updateClaimDto, '1', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processClaim', () => {
    it('should process claim with oracle and send notification', async () => {
      const existingClaim = { ...mockClaim, status: ClaimStatus.PENDING };
      const updatedClaim = { ...existingClaim, status: ClaimStatus.APPROVED };

      claimRepository.findOne.mockResolvedValue(existingClaim as any);
      oracleService.verifyClaim.mockResolvedValue('approved');
      claimRepository.save.mockResolvedValue(updatedClaim as any);
      notificationService.sendClaimProcessingNotification.mockResolvedValue();

      await service.processClaim(1);

      expect(claimRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(oracleService.verifyClaim).toHaveBeenCalledWith(1, existingClaim.description);
      expect(claimRepository.save).toHaveBeenCalled();
      expect(notificationService.sendClaimProcessingNotification).toHaveBeenCalledWith(
        updatedClaim,
        mockUser,
        'approved',
      );
    });

    it('should handle notification failure gracefully during processing', async () => {
      const existingClaim = { ...mockClaim, status: ClaimStatus.PENDING };
      const updatedClaim = { ...existingClaim, status: ClaimStatus.REJECTED };

      claimRepository.findOne.mockResolvedValue(existingClaim as any);
      oracleService.verifyClaim.mockResolvedValue('rejected');
      claimRepository.save.mockResolvedValue(updatedClaim as any);
      notificationService.sendClaimProcessingNotification.mockRejectedValue(new Error('SMTP error'));

      await service.processClaim(1);

      expect(notificationService.sendClaimProcessingNotification).toHaveBeenCalled();
    });

    it('should throw NotFoundException when claim not found', async () => {
      claimRepository.findOne.mockResolvedValue(null);

      await expect(service.processClaim(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when claim is not pending', async () => {
      const existingClaim = { ...mockClaim, status: ClaimStatus.APPROVED };

      claimRepository.findOne.mockResolvedValue(existingClaim as any);

      await expect(service.processClaim(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByUser', () => {
    it('should return claims for a specific user', async () => {
      const userClaims = [mockClaim];

      claimRepository.find.mockResolvedValue(userClaims as any);

      const result = await service.findAllByUser('1');

      expect(claimRepository.find).toHaveBeenCalledWith({
        where: { userId: '1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return all claims with user relations', async () => {
      const allClaims = [mockClaim];

      claimRepository.find.mockResolvedValue(allClaims as any);

      const result = await service.findAll();

      expect(claimRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a claim by id', async () => {
      claimRepository.findOne.mockResolvedValue(mockClaim as any);

      const result = await service.findOne(1, '1', false);

      expect(claimRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when claim not found', async () => {
      claimRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, '1', false)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user tries to access another user claim', async () => {
      const otherUserClaim = { ...mockClaim, userId: '2' };

      claimRepository.findOne.mockResolvedValue(otherUserClaim as any);

      await expect(service.findOne(1, '1', false)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to access any claim', async () => {
      const otherUserClaim = { ...mockClaim, userId: '2' };

      claimRepository.findOne.mockResolvedValue(otherUserClaim as any);

      const result = await service.findOne(1, '1', true);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove a claim', async () => {
      claimRepository.findOne.mockResolvedValue(mockClaim as any);
      claimRepository.remove.mockResolvedValue(mockClaim as any);

      await service.remove(1, '1', false);

      expect(claimRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(claimRepository.remove).toHaveBeenCalledWith(mockClaim);
    });

    it('should throw NotFoundException when claim not found', async () => {
      claimRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, '1', false)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user tries to delete another user claim', async () => {
      const otherUserClaim = { ...mockClaim, userId: '2' };

      claimRepository.findOne.mockResolvedValue(otherUserClaim as any);

      await expect(service.remove(1, '1', false)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getClaimStats', () => {
    it('should return claim statistics', async () => {
      claimRepository.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(5) // approved
        .mockResolvedValueOnce(2); // rejected

      const result = await service.getClaimStats();

      expect(result).toEqual({
        total: 10,
        pending: 3,
        approved: 5,
        rejected: 2,
      });
    });
  });
});
