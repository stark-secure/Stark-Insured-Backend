import { Test, TestingModule } from '@nestjs/testing';
import { OracleController } from './oracle.controller';
import { OracleService } from './oracle.service';

describe('OracleController', () => {
  let controller: OracleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OracleController],
      providers: [OracleService],
    }).compile();

    controller = module.get<OracleController>(OracleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
