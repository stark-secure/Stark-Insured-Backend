import { Test, TestingModule } from '@nestjs/testing';
import { FraudDetectionController } from './fraud-detection.controller';
import { FraudDetectionService } from './fraud-detection.service';

describe('FraudDetectionController', () => {
  let controller: FraudDetectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FraudDetectionController],
      providers: [FraudDetectionService],
    }).compile();

    controller = module.get<FraudDetectionController>(FraudDetectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
