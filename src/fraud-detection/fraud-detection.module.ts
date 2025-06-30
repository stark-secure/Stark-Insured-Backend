import { Module } from '@nestjs/common';
import { FraudDetectionService } from './interfaces/fraud-detection.interface';
import { MockFraudDetectionService } from './services/mock-fraud-detection.service';

@Module({
  providers: [
    {
      provide: FraudDetectionService,
      useClass: MockFraudDetectionService,
    },
  ],
  exports: [FraudDetectionService],
})
export class FraudDetectionModule {}
