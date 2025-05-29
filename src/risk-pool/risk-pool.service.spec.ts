import { Test, TestingModule } from '@nestjs/testing';
import { RiskPoolService } from './risk-pool.service';

describe('RiskPoolService', () => {
  let service: RiskPoolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskPoolService],
    }).compile();

    service = module.get<RiskPoolService>(RiskPoolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
