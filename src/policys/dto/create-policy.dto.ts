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

export class CreatePolicyDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  coverageAmount: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  premium: number;

  @IsDate()
  @Type(() => Date)
  @Transform(({ value }: { value: string | number | Date }) => new Date(value))
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  @Transform(({ value }: { value: string | number | Date }) => new Date(value))
  endDate: Date;

  @IsEnum(PolicyStatus)
  @ValidateIf((o: { status?: PolicyStatus }) => o.status !== undefined)
  status?: PolicyStatus = PolicyStatus.ACTIVE;
}
