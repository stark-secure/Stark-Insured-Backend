import { Controller } from '@nestjs/common';
import { FraudDetectionService } from './fraud-detection.service';

@Controller('fraud-detection')
export class FraudDetectionController {
  constructor(private readonly fraudDetectionService: FraudDetectionService) {}
}
