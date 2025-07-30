import { ApiProperty } from '@nestjs/swagger';

export class LpBalanceHistoryPointDto {
  @ApiProperty({
    description: 'Timestamp for this balance point',
    example: '2025-06-01T00:00:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'LP token balance at this timestamp',
    example: '100.50000000'
  })
  balance: string;
}

export class LpBalanceHistoryResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'uuid-string'
  })
  userId: string;

  @ApiProperty({
    description: 'Start date of the requested range',
    example: '2025-01-01T00:00:00Z'
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of the requested range',
    example: '2025-07-30T23:59:59Z'
  })
  endDate: string;

  @ApiProperty({
    description: 'Data aggregation interval',
    example: 'daily'
  })
  interval: string;

  @ApiProperty({
    description: 'Array of balance history points',
    type: [LpBalanceHistoryPointDto]
  })
  history: LpBalanceHistoryPointDto[];

  @ApiProperty({
    description: 'Total number of data points',
    example: 30
  })
  totalPoints: number;

  @ApiProperty({
    description: 'Current balance',
    example: '120.75000000'
  })
  currentBalance: string;
}
