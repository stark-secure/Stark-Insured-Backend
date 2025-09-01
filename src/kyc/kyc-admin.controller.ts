import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { KycService } from './kyc.service';
import { KycStatus } from './dto/kyc-verification.dto';

@ApiTags('KYC Admin')
@Controller('admin/kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KycAdminController {
  constructor(private readonly kycService: KycService) {}

  @Patch(':verificationId/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually approve or reject a pending KYC verification' })
  @ApiParam({ name: 'verificationId', description: 'KYC verification ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'KYC status updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'KYC verification not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid status or not pending' })
  async updateKycStatus(
    @Param('verificationId') verificationId: string,
    @Body('status') status: KycStatus,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    if (![KycStatus.APPROVED, KycStatus.REJECTED].includes(status)) {
      throw new BadRequestException('Status must be approved or rejected');
    }
    const updated = await this.kycService.adminUpdateKycStatus(verificationId, status, rejectionReason);
    if (!updated) throw new NotFoundException('KYC verification not found or not pending');
    return { message: 'KYC status updated', status };
  }
}
