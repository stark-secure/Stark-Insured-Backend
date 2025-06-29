import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { OracleService } from './oracle.service';

@Controller('oracle')
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  @Post('verify/:claimId')
  async verifyClaim(
    @Param('claimId', ParseIntPipe) claimId: number,
    @Body() claimDetails: { details: string },
  ) {
    return this.oracleService.verifyClaim(claimId, claimDetails.details);
  }
}
