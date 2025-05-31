import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreatePolicyDto } from './create-policy.dto';
import { PolicyStatus } from '../entities/policy.entity';

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;
}
