import { Test, TestingModule } from '@nestjs/testing';
import { KycAdminController } from './kyc-admin.controller';
import { KycService } from './kyc.service';
import { KycStatus } from './dto/kyc-verification.dto';

describe('KycAdminController', () => {
  let controller: KycAdminController;
  let service: KycService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KycAdminController],
      providers: [
        {
          provide: KycService,
          useValue: {
            adminUpdateKycStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<KycAdminController>(KycAdminController);
    service = module.get<KycService>(KycService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should update KYC status to approved', async () => {
    jest.spyOn(service, 'adminUpdateKycStatus').mockResolvedValue(true);
    const result = await controller.updateKycStatus('test-id', KycStatus.APPROVED);
    expect(result).toEqual({ message: 'KYC status updated', status: KycStatus.APPROVED });
  });

  it('should throw if status is invalid', async () => {
    await expect(controller.updateKycStatus('test-id', 'pending' as any)).rejects.toThrow();
  });

  it('should throw if not found', async () => {
    jest.spyOn(service, 'adminUpdateKycStatus').mockResolvedValue(false);
    await expect(controller.updateKycStatus('bad-id', KycStatus.REJECTED)).rejects.toThrow();
  });
});
