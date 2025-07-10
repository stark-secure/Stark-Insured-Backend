import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { OracleService } from './oracle.service';
import { OracleGuard } from './guards/oracle.guard';
import { OracleVerificationDto } from './dto/create-oracle.dto';
import { OracleVerificationResponseDto } from './dto/oracle-response.dto';

@ApiTags('Oracle')
@Controller('oracle')
export class OracleController {
  private readonly logger = new Logger(OracleController.name);

  constructor(private readonly oracleService: OracleService) {}

  @Post('verify')
  @UseGuards(OracleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify claim with oracle signature',
    description: 'Endpoint for authorized oracles to verify claims with cryptographic signatures'
  })
  @ApiBody({ type: OracleVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Claim verification processed successfully',
    type: OracleVerificationResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid oracle signature' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async verifyClaimWithSignature(
    @Body() verificationDto: OracleVerificationDto,
  ): Promise<OracleVerificationResponseDto> {
    this.logger.log(`Oracle verification request received for claim ${verificationDto.claimId}`);

    return this.oracleService.verifyClaimWithSignature({
      claimId: verificationDto.claimId,
      signature: verificationDto.signature,
      eventType: verificationDto.eventType,
      timestamp: verificationDto.timestamp,
      verificationData: verificationDto.verificationData
    });
  }

  @Get('status/:claimId')
  @ApiOperation({
    summary: 'Get oracle verification status for a claim',
    description: 'Check if a claim has been verified by oracle and get verification details'
  })
  @ApiParam({ name: 'claimId', description: 'Claim ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Verification status retrieved successfully',
    schema: {
      properties: {
        verified: { type: 'boolean' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async getVerificationStatus(
    @Param('claimId', ParseIntPipe) claimId: number,
  ) {
    return this.oracleService.getVerificationStatus(claimId);
  }

  // Legacy endpoint for backward compatibility
  @Post('verify/:claimId')
  @ApiOperation({
    summary: 'Legacy claim verification (deprecated)',
    description: 'Legacy endpoint for claim verification. Use POST /oracle/verify instead.'
  })
  @ApiParam({ name: 'claimId', description: 'Claim ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyClaim(
    @Param('claimId', ParseIntPipe) claimId: number,
    @Body() claimDetails: { details: string },
  ) {
    this.logger.warn(`Using deprecated endpoint for claim ${claimId}`);
    return this.oracleService.verifyClaim(claimId, claimDetails.details);
  }
}
