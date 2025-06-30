import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClaimStatus } from '../enums/claim-status.enum';

export class UpdateClaimDto {
  @ApiProperty({
    description: 'Status of the claim',
    enum: ClaimStatus,
    example: ClaimStatus.APPROVED,
    required: false
  })
  @IsOptional()
  @IsEnum(ClaimStatus, { message: 'Status must be one of: PENDING, APPROVED, REJECTED' })
  status?: ClaimStatus;

  @ApiProperty({
    description: 'Updated description of the claim',
    example: 'Updated claim description with additional details',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}