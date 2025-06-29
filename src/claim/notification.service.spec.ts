import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ClaimNotificationService } from './notification.service';
import { MailService } from '../mail/mail.service';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { User } from '../user/entities/user.entity';

describe('ClaimNotificationService', () => {
  let service: ClaimNotificationService;
  let mailService: jest.Mocked<MailService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    role: 'USER' as any,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    policies: [],
    claims: [],
    kycVerifications: [],
    get latestKycVerification() {
      return undefined;
    },
  } as User;

  const mockClaim: Claim = {
    id: 1,
    type: 'Property Damage',
    description: 'Vehicle damaged due to hail storm',
    status: ClaimStatus.PENDING,
    userId: '1',
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Claim;

  beforeEach(async () => {
    const mockMailService = {
      sendClaimUpdateEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimNotificationService,
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<ClaimNotificationService>(ClaimNotificationService);
    mailService = module.get(MailService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendClaimStatusNotification', () => {
    it('should send notification for PENDING -> APPROVED transition', async () => {
      const event = {
        claim: mockClaim,
        user: mockUser,
        previousStatus: ClaimStatus.PENDING,
        newStatus: ClaimStatus.APPROVED,
      };

      await service.sendClaimStatusNotification(event);

      expect(mailService.sendClaimUpdateEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          firstName: 'John',
          claimId: 1,
          status: ClaimStatus.APPROVED,
          remarks: 'Your claim has been approved and will be processed for payout.',
        },
      );
    });

    it('should send notification for PENDING -> REJECTED transition', async () => {
      const event = {
        claim: mockClaim,
        user: mockUser,
        previousStatus: ClaimStatus.PENDING,
        newStatus: ClaimStatus.REJECTED,
      };

      await service.sendClaimStatusNotification(event);

      expect(mailService.sendClaimUpdateEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          firstName: 'John',
          claimId: 1,
          status: ClaimStatus.REJECTED,
          remarks: 'Your claim has been rejected. Please review the details and contact support if you have questions.',
        },
      );
    });

    it('should use custom remarks when provided', async () => {
      const event = {
        claim: mockClaim,
        user: mockUser,
        previousStatus: ClaimStatus.PENDING,
        newStatus: ClaimStatus.APPROVED,
        remarks: 'Custom approval message with specific details.',
      };

      await service.sendClaimStatusNotification(event);

      expect(mailService.sendClaimUpdateEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          firstName: 'John',
          claimId: 1,
          status: ClaimStatus.APPROVED,
          remarks: 'Custom approval message with specific details.',
        },
      );
    });

    it('should not send notification for same status', async () => {
      const event = {
        claim: mockClaim,
        user: mockUser,
        previousStatus: ClaimStatus.PENDING,
        newStatus: ClaimStatus.PENDING,
      };

      await service.sendClaimStatusNotification(event);

      expect(mailService.sendClaimUpdateEmail).not.toHaveBeenCalled();
    });

    it('should not send notification when user has no email', async () => {
      const userWithoutEmail = { 
        ...mockUser, 
        email: '',
        get latestKycVerification() {
          return undefined;
        },
      };
      const event = {
        claim: mockClaim,
        user: userWithoutEmail,
        previousStatus: ClaimStatus.PENDING,
        newStatus: ClaimStatus.APPROVED,
      };

      await service.sendClaimStatusNotification(event);

      expect(mailService.sendClaimUpdateEmail).not.toHaveBeenCalled();
    });

    it('should not send notification for invalid email format', async () => {
      const userWithInvalidEmail = { 
        ...mockUser, 
        email: 'invalid-email',
        get latestKycVerification() {
          return undefined;
        },
      };
      const event = {
        claim: mockClaim,
        user: userWithInvalidEmail,
        previousStatus: ClaimStatus.PENDING,
        newStatus: ClaimStatus.APPROVED,
      };

      await service.sendClaimStatusNotification(event);

      expect(mailService.sendClaimUpdateEmail).not.toHaveBeenCalled();
    });

    it('should handle email service errors gracefully', async () => {
      const event = {
        claim: mockClaim,
        user: mockUser,
        previousStatus: ClaimStatus.PENDING,
        newStatus: ClaimStatus.APPROVED,
      };

      mailService.sendClaimUpdateEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendClaimStatusNotification(event)).resolves.not.toThrow();

      expect(mailService.sendClaimUpdateEmail).toHaveBeenCalled();
    });
  });

  describe('sendClaimSubmittedNotification', () => {
    it('should send notification for new claim submission', async () => {
      await service.sendClaimSubmittedNotification(mockClaim, mockUser);

      expect(mailService.sendClaimUpdateEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          firstName: 'John',
          claimId: 1,
          status: ClaimStatus.PENDING,
          remarks: 'Your claim has been submitted and is under review. We will notify you once the review is complete.',
        },
      );
    });

    it('should not send notification when user has no email', async () => {
      const userWithoutEmail = { 
        ...mockUser, 
        email: '',
        get latestKycVerification() {
          return undefined;
        },
      };

      await service.sendClaimSubmittedNotification(mockClaim, userWithoutEmail);

      expect(mailService.sendClaimUpdateEmail).not.toHaveBeenCalled();
    });

    it('should handle email service errors gracefully', async () => {
      mailService.sendClaimUpdateEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(service.sendClaimSubmittedNotification(mockClaim, mockUser)).resolves.not.toThrow();

      expect(mailService.sendClaimUpdateEmail).toHaveBeenCalled();
    });
  });

  describe('sendClaimProcessingNotification', () => {
    it('should send notification for oracle processing completion', async () => {
      const processedClaim = { ...mockClaim, status: ClaimStatus.APPROVED };
      const oracleVerdict = 'approved';

      await service.sendClaimProcessingNotification(processedClaim, mockUser, oracleVerdict);

      expect(mailService.sendClaimUpdateEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          firstName: 'John',
          claimId: 1,
          status: ClaimStatus.APPROVED,
          remarks: 'Your claim has been processed by our automated system. The verdict is: approved.',
        },
      );
    });

    it('should not send notification when user has no email', async () => {
      const userWithoutEmail = { 
        ...mockUser, 
        email: '',
        get latestKycVerification() {
          return undefined;
        },
      };
      const processedClaim = { ...mockClaim, status: ClaimStatus.REJECTED };
      const oracleVerdict = 'rejected';

      await service.sendClaimProcessingNotification(processedClaim, userWithoutEmail, oracleVerdict);

      expect(mailService.sendClaimUpdateEmail).not.toHaveBeenCalled();
    });
  });

  describe('status transition logic', () => {
    it('should send notification for APPROVED -> REJECTED transition', async () => {
      const event = {
        claim: { ...mockClaim, status: ClaimStatus.REJECTED },
        user: mockUser,
        previousStatus: ClaimStatus.APPROVED,
        newStatus: ClaimStatus.REJECTED,
      };

      await service.sendClaimStatusNotification(event);

      expect(mailService.sendClaimUpdateEmail).toHaveBeenCalled();
    });

    it('should send notification for REJECTED -> APPROVED transition', async () => {
      const event = {
        claim: { ...mockClaim, status: ClaimStatus.APPROVED },
        user: mockUser,
        previousStatus: ClaimStatus.REJECTED,
        newStatus: ClaimStatus.APPROVED,
      };

      await service.sendClaimStatusNotification(event);

      expect(mailService.sendClaimUpdateEmail).toHaveBeenCalled();
    });
  });
}); 