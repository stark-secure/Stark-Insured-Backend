import { IsString, IsEnum, IsDate, IsOptional, Length, MinLength, IsInt, Min, ValidateIf, Validate } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProposalStatus } from '../entities/proposal.entity';

class DateRangeValidator {
  validate(value: any, args: any) {
    const object = args.object;
    if (object.startDate && object.expiryDate) {
      return new Date(object.startDate) < new Date(object.expiryDate);
    }
    return true;
  }
  
  defaultMessage() {
    return 'Start date must be before expiry date';
  }
}

export class CreateProposalDto {
  @ApiProperty({ 
    description: 'Proposal title', 
    minLength: 10, 
    maxLength: 100,
    example: 'Community Fund Allocation for Q2 2024' 
  })
  @IsString()
  @Length(10, 100, { message: 'Title must be between 10 and 100 characters' })
  title: string;

  @ApiProperty({ 
    description: 'Detailed proposal description', 
    minLength: 50,
    example: 'This proposal outlines the allocation of community funds for the second quarter of 2024...' 
  })
  @IsString()
  @MinLength(50, { message: 'Description must be at least 50 characters long' })
  description: string;

  @ApiProperty({ 
    description: 'Proposal status', 
    enum: ProposalStatus,
    example: ProposalStatus.DRAFT 
  })
  @IsEnum(ProposalStatus)
  status: ProposalStatus;

  @ApiProperty({ 
    description: 'Proposal start date', 
    example: '2024-07-01T00:00:00.000Z' 
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @ApiProperty({ 
    description: 'Proposal expiry date', 
    example: '2024-07-31T23:59:59.999Z' 
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  @Validate(DateRangeValidator)
  expiryDate: Date;

  @ApiProperty({ 
    description: 'Initial vote count', 
    minimum: 0,
    example: 0,
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  voteCount?: number;

  @ApiProperty({ 
    description: 'Creator identifier', 
    maxLength: 255,
    example: 'user123',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  createdBy?: string;
}
