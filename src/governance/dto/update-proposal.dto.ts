import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';

export class UpdateProposalDto {
  @ApiProperty({
    description: 'Proposal title',
    example: 'Updated Proposal Title',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    description: 'Proposal description',
    example: 'Updated detailed description of the proposal',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Proposal expiry date',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiry?: Date;
}
