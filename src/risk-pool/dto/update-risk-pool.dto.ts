import { PartialType } from '@nestjs/mapped-types';
import { CreateRiskPoolDto } from './create-risk-pool.dto';
import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateRiskPoolDto extends PartialType(CreateRiskPoolDto) {
  @IsOptional()
  @IsNumber()
  @Min(0)
  activeCoverage?: number;

  @IsOptional()
  @IsNumber()
  apy?: number;
}