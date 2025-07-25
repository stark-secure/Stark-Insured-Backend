import { IsOptional, IsIn, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LpTokenEventQueryDto {
  @IsOptional()
  @IsIn(['mint', 'burn'])
  eventType?: 'mint' | 'burn';

  @IsOptional()
  @IsUUID()
  userAddress?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
} 