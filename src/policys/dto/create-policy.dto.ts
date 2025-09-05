import {
  IsNumber,
  IsDate,
  IsEnum,
  IsPositive,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PolicyStatus } from '../entities/policy.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePolicyDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  @ApiProperty({ description: 'Total coverage amount', example: 1000.5 })
  coverageAmount: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  @ApiProperty({ description: 'Premium amount to be paid', example: 12.5 })
  premium: number;

  @IsDate()
  @Type(() => Date)
  @Transform(({ value }: { value: string | number | Date }) => new Date(value))
  @ApiProperty({ description: 'Policy start date', type: String, example: '2025-01-01T00:00:00Z' })
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  @Transform(({ value }: { value: string | number | Date }) => new Date(value))
  @ApiProperty({ description: 'Policy end date', type: String, example: '2025-12-31T23:59:59Z' })
  endDate: Date;

  @IsEnum(PolicyStatus)
  @ValidateIf((o: { status?: PolicyStatus }) => o.status !== undefined)
  @ApiProperty({ description: 'Policy status', enum: PolicyStatus, required: false })
  status?: PolicyStatus = PolicyStatus.ACTIVE;
}
