import { Module } from '@nestjs/common';
import { RiskPoolService } from './risk-pool.service';
import { RiskPoolController } from './risk-pool.controller';

@Module({
  providers: [RiskPoolService],
  controllers: [RiskPoolController]
})
export class RiskPoolModule {}
