import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProposalStatus } from '../entities/proposal.entity';

export class GetProposalsDto {
  @ApiProperty({
    description: 'Page number',
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by proposal status',
    enum: ProposalStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;

  @ApiProperty({
    description: 'Sort proposals by field',
    enum: ['createdAt', 'expiryDate', 'voteCount'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'expiryDate', 'voteCount'])
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({
    description: 'Search term for title or description',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
