import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { Claim } from '../claim/entities/claim.entity';
import { EventType } from './dto/create-oracle.dto';
import { ClaimStatus } from '../claim/enums/claim-status.enum';

describe('OracleService', () => {
  let service: OracleService;
  let httpService: HttpService;
  let configService: ConfigService;
  let claimRepository: Repository<Claim>;

  const mockClaim = {
    id: 1,
    type: 'wallet_exploit',
    description: 'Test claim',
    status: ClaimStatus.PENDING,
    oracleVerified: false,
    oracleData: null,
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHttpService = {
    axiosRef: {
      post: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        ORACLE_MAX_TIMESTAMP_AGE: 86400,
        ORACLE_PUBLIC_KEY_1: 'test-key-1',
        ORACLE_PUBLIC_KEY_2: 'test-key-2',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockClaimRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OracleService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(Claim),
          useValue: mockClaimRepository,
        },
      ],
    }).compile();

    service = module.get<OracleService>(OracleService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    claimRepository = module.get<Repository<Claim>>(getRepositoryToken(Claim));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyClaimWithSignature', () => {
    const validPayload = {
      claimId: 1,
      signature: '0x1234567890abcdef',
      eventType: EventType.WALLET_EXPLOIT,
      timestamp: new Date().toISOString(),
      verificationData: {
        transactionHash: '0xabc123',
        blockNumber: 18500000,
      },
    };

    it('should successfully verify a claim with valid payload', async () => {
      mockClaimRepository.findOne.mockResolvedValue(mockClaim);
      mockClaimRepository.save.mockResolvedValue({
        ...mockClaim,
        oracleVerified: true,
      });

      const result = await service.verifyClaimWithSignature(validPayload);

      expect(result.success).toBe(true);
      expect(result.claimId).toBe(1);
      expect(result.signatureValid).toBe(true);
      expect(mockClaimRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent claim', async () => {
      mockClaimRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyClaimWithSignature(validPayload))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for future timestamp', async () => {
      const futurePayload = {
        ...validPayload,
        timestamp: new Date(Date.now() + 86400000).toISOString(), // 1 day in future
      };

      await expect(service.verifyClaimWithSignature(futurePayload))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for old timestamp', async () => {
      const oldPayload = {
        ...validPayload,
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      };

      await expect(service.verifyClaimWithSignature(oldPayload))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status for existing claim', async () => {
      const verifiedClaim = {
        ...mockClaim,
        oracleVerified: true,
        oracleData: { verifiedAt: new Date() },
      };
      mockClaimRepository.findOne.mockResolvedValue(verifiedClaim);

      const result = await service.getVerificationStatus(1);

      expect(result.verified).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should throw NotFoundException for non-existent claim', async () => {
      mockClaimRepository.findOne.mockResolvedValue(null);

      await expect(service.getVerificationStatus(999))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should calculate higher score for wallet exploit with verification data', () => {
      const score = service['calculateConfidenceScore'](
        EventType.WALLET_EXPLOIT,
        {
          transactionHash: '0xabc123',
          blockNumber: 18500000,
          affectedAddress: '0xdef456',
        }
      );

      expect(score).toBeGreaterThan(0.9);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should calculate lower score for OTHER event type', () => {
      const score = service['calculateConfidenceScore'](EventType.OTHER);

      expect(score).toBe(0.6);
    });
  });

  describe('legacy verifyClaim', () => {
    it('should return approved for valid response', async () => {
      mockHttpService.axiosRef.post.mockResolvedValue({
        data: { valid: true },
      });

      const result = await service.verifyClaim(1, 'test claim');

      expect(result).toBe('approved');
    });

    it('should return rejected for invalid response', async () => {
      mockHttpService.axiosRef.post.mockResolvedValue({
        data: { valid: false },
      });

      const result = await service.verifyClaim(1, 'test claim');

      expect(result).toBe('rejected');
    });

    it('should throw error on HTTP failure', async () => {
      mockHttpService.axiosRef.post.mockRejectedValue(new Error('Network error'));

      await expect(service.verifyClaim(1, 'test claim'))
        .rejects.toThrow('Oracle response failed');
    });
  });
});
