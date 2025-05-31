import { Test, TestingModule } from '@nestjs/testing';
import { PolicysController } from './policys.controller';
import { PolicysService } from './policys.service';

describe('PolicysController', () => {
  let controller: PolicysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolicysController],
      providers: [PolicysService],
    }).compile();

    controller = module.get<PolicysController>(PolicysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
