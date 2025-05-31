import { Test, TestingModule } from '@nestjs/testing';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';

describe('ClaimController', () => {
  let controller: ClaimController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaimController],
      providers: [ClaimService],
    }).compile();

    controller = module.get<ClaimController>(ClaimController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
