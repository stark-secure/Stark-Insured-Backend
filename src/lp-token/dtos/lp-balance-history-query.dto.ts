import { IsOptional, IsUUID, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LpBalanceHistoryQueryDto {
  @ApiProperty({
    description: 'Start date for the history range (ISO date string)',
    required: false,
    example: '2025-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the history range (ISO date string)',
    required: false,
    example: '2025-07-30T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Interval for data aggregation',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    example: 'daily'
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  interval?: 'daily' | 'weekly' | 'monthly' = 'daily';
}
