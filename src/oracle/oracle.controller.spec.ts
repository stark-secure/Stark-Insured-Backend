import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OracleController } from './oracle.controller';
import { OracleService } from './oracle.service';
import { OracleGuard } from './guards/oracle.guard';
import { EventType } from './dto/create-oracle.dto';

describe('OracleController', () => {
  let controller: OracleController;
  let oracleService: OracleService;

  const mockOracleService = {
    verifyClaimWithSignature: jest.fn(),
    getVerificationStatus: jest.fn(),
    verifyClaim: jest.fn(),
  };

  const mockOracleGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        ORACLE_PUBLIC_KEY_1: 'test-key-1',
        ORACLE_PUBLIC_KEY_2: 'test-key-2',
        ORACLE_MAX_TIMESTAMP_AGE: 86400,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OracleController],
      providers: [
        {
          provide: OracleService,
          useValue: mockOracleService,
        },
        {
          provide: OracleGuard,
          useValue: mockOracleGuard,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<OracleController>(OracleController);
    oracleService = module.get<OracleService>(OracleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyClaimWithSignature', () => {
    const validVerificationDto = {
      claimId: 1,
      signature: '0x1234567890abcdef',
      eventType: EventType.WALLET_EXPLOIT,
      timestamp: new Date().toISOString(),
      verificationData: {
        transactionHash: '0xabc123',
        blockNumber: 18500000,
      },
    };

    const mockResponse = {
      success: true,
      claimId: 1,
      message: 'Claim successfully verified by oracle',
      verifiedAt: new Date().toISOString(),
      signatureValid: true,
      metadata: {
        eventType: EventType.WALLET_EXPLOIT,
        confidenceScore: 0.95,
      },
    };

    it('should successfully verify claim with valid signature', async () => {
      mockOracleService.verifyClaimWithSignature.mockResolvedValue(mockResponse);

      const result = await controller.verifyClaimWithSignature(validVerificationDto);

      expect(result).toEqual(mockResponse);
      expect(mockOracleService.verifyClaimWithSignature).toHaveBeenCalledWith({
        claimId: validVerificationDto.claimId,
        signature: validVerificationDto.signature,
        eventType: validVerificationDto.eventType,
        timestamp: validVerificationDto.timestamp,
        verificationData: validVerificationDto.verificationData,
      });
    });

    it('should handle service errors', async () => {
      mockOracleService.verifyClaimWithSignature.mockRejectedValue(
        new NotFoundException('Claim not found')
      );

      await expect(controller.verifyClaimWithSignature(validVerificationDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status for existing claim', async () => {
      const mockStatus = {
        verified: true,
        data: {
          verifiedAt: new Date(),
          eventType: EventType.WALLET_EXPLOIT,
        },
      };

      mockOracleService.getVerificationStatus.mockResolvedValue(mockStatus);

      const result = await controller.getVerificationStatus(1);

      expect(result).toEqual(mockStatus);
      expect(mockOracleService.getVerificationStatus).toHaveBeenCalledWith(1);
    });

    it('should handle non-existent claim', async () => {
      mockOracleService.getVerificationStatus.mockRejectedValue(
        new NotFoundException('Claim not found')
      );

      await expect(controller.getVerificationStatus(999))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyClaim (legacy)', () => {
    it('should handle legacy verification', async () => {
      mockOracleService.verifyClaim.mockResolvedValue('approved');

      const result = await controller.verifyClaim(1, { details: 'test claim' });

      expect(result).toBe('approved');
      expect(mockOracleService.verifyClaim).toHaveBeenCalledWith(1, 'test claim');
    });

    it('should handle legacy verification rejection', async () => {
      mockOracleService.verifyClaim.mockResolvedValue('rejected');

      const result = await controller.verifyClaim(1, { details: 'test claim' });

      expect(result).toBe('rejected');
    });
  });
});
