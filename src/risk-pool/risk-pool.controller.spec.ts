import { Test, TestingModule } from '@nestjs/testing';
import { RiskPoolController } from './risk-pool.controller';

describe('RiskPoolController', () => {
  let controller: RiskPoolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskPoolController],
    }).compile();

    controller = module.get<RiskPoolController>(RiskPoolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
