import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);

  constructor(private readonly httpService: HttpService) {}

  async verifyClaim(claimId: number, claimDetails: string): Promise<'approved' | 'rejected'> {
    try {
      const response = await this.httpService.axiosRef.post('https://mock-oracle/verify', {
        claimId,
        details: claimDetails,
      });

      this.logger.log(`Oracle response for claim ${claimId}: ${JSON.stringify(response.data)}`);

      if (response.data.valid) return 'approved';
      return 'rejected';
    } catch (err) {
      this.logger.error(`Oracle verification failed for claim ${claimId}`, err.stack);
      throw new Error('Oracle response failed');
    }
  }
}