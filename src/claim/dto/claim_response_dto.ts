import { ApiProperty } from '@nestjs/swagger';
import { ClaimStatus } from '../enums/claim-status.enum';

export class ClaimResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the claim',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: 'Type of the claim',
    example: 'Property Damage'
  })
  type: string;

  @ApiProperty({
    description: 'Description of the claim',
    example: 'Vehicle damaged due to hail storm'
  })
  description: string;

  @ApiProperty({
    description: 'Current status of the claim',
    enum: ClaimStatus,
    example: ClaimStatus.PENDING
  })
  status: ClaimStatus;

  @ApiProperty({
    description: 'Date when the claim was created',
    example: '2024-03-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the claim was last updated',
    example: '2024-03-15T10:30:00Z'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the user who created the claim',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  userId: string;

  constructor(claim: any) {
    this.id = claim.id;
    this.type = claim.type;
    this.description = claim.description;
    this.status = claim.status;
    this.createdAt = claim.createdAt;
    this.updatedAt = claim.updatedAt;
    this.userId = claim.userId;
  }
}