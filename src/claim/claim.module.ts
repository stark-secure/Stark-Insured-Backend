import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';
import { Claim } from './entities/claim.entity';
import { OracleModule } from 'src/oracle/oracle.module';
import { FraudDetectionModule } from '../fraud-detection/fraud-detection.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Claim]), 
    OracleModule,
    FraudDetectionModule,
  ],
  controllers: [ClaimController],
  providers: [ClaimService],
  exports: [ClaimService],
})
export class ClaimModule {}