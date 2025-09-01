import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  KycVerificationRequestDto,
  KycVerificationResponseDto,
} from './dto/kyc-verification.dto';
import { KycService } from './kyc.service';

@ApiTags('KYC Verification')
@Controller('user/kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('verify')
  @ApiOperation({
    summary: 'Submit KYC verification request',
    description: `
      Submit a Know Your Customer (KYC) verification request for the authenticated user.
      This endpoint accepts user identification documents and personal information for verification.
      
      **Current Implementation**: This is a stubbed implementation that simulates real KYC provider behavior.
      
      **Security Notes**:
      - Document images are hashed before storage
      - Sensitive data is not logged
      - Only the document hash is persisted
      
      **Testing**: Use the 'simulateResult' field to test different verification outcomes.
    `,
  })
  @ApiBody({
    type: KycVerificationRequestDto,
    examples: {
      'successful-verification': {
        summary: 'Successful verification',
        value: {
          fullName: 'John Michael Doe',
          dob: '1990-05-15',
          nationalId: 'A1234567890',
          documentType: 'national_id',
          documentImage:
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
          simulateResult: 'approved',
        },
      },
      'pending-verification': {
        summary: 'Verification requiring manual review',
        value: {
          fullName: 'Jane Smith',
          dob: '1985-12-03',
          nationalId: 'B9876543210',
          documentType: 'passport',
          documentImage:
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
          simulateResult: 'pending',
        },
      },
      'rejected-verification': {
        summary: 'Rejected verification',
        value: {
          fullName: 'Test User',
          dob: '2000-01-01',
          nationalId: 'TEST123456',
          documentType: 'drivers_license',
          documentImage:
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
          simulateResult: 'rejected',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'KYC verification request submitted successfully',
    type: KycVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or user already has approved KYC',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  verifyKyc(
    @Request() req,
    @Body() kycData: KycVerificationRequestDto,
  ): Promise<KycVerificationResponseDto> {
    const userId = req.user.id;
    // Extract IP and user-agent for audit
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.kycService.verifyKyc(userId, kycData, ip, userAgent);
  }

  @Get('status/:verificationId')
  @ApiOperation({
    summary: 'Get KYC verification status',
    description: `
      Retrieve the current status of a specific KYC verification request.
      
      **Possible Statuses**:
      - \`pending\`: Verification is being processed
      - \`approved\`: Verification was successful
      - \`rejected\`: Verification was rejected (see rejectionReason for details)
    `,
  })
  @ApiParam({
    name: 'verificationId',
    description: 'Unique verification ID returned from the verify endpoint',
    example: 'kyc_12345678-1234-5678-9012-123456789012',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC verification status retrieved successfully',
    type: KycVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'KYC verification not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  getKycStatus(
    @Request() req,
    @Param('verificationId') verificationId: string,
  ): Promise<KycVerificationResponseDto> {
    const userId = req.user.id;
    return this.kycService.getKycStatus(userId, verificationId);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get user KYC verification history',
    description: `
      Retrieve all KYC verification requests for the authenticated user.
      Results are ordered by creation date (most recent first).
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC verification history retrieved successfully',
    type: [KycVerificationResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  getKycHistory(@Request() req): Promise<KycVerificationResponseDto[]> {
    const userId = req.user.id;
    return this.kycService.getUserKycVerifications(userId);
  }
}
