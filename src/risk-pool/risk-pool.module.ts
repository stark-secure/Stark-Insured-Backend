import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskPoolService } from './risk-pool.service';
import { RiskPoolController } from './risk-pool.controller';
import { RiskPool } from './entities/risk-pool.entity';
import { RiskPoolRebalanceLog } from './entities/risk-pool-rebalance-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RiskPool, RiskPoolRebalanceLog])],
  providers: [RiskPoolService],
  controllers: [RiskPoolController],
  exports: [RiskPoolService],
})
export class RiskPoolModule {}
