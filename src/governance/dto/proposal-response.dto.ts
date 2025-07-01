import { ApiProperty } from '@nestjs/swagger';

export class ProposalResponseDto {
  @ApiProperty({
    description: 'Proposal ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Proposal title',
    example: 'Increase DAO Treasury Allocation',
  })
  title: string;

  @ApiProperty({
    description: 'Proposal description',
    example: 'This proposal aims to increase the treasury allocation by 10%',
  })
  description: string;

  @ApiProperty({
    description: 'Creator user ID',
    example: 'creator-uuid',
  })
  creatorId: string;

  @ApiProperty({
    description: 'Proposal expiry date',
    example: '2024-12-31T23:59:59Z',
  })
  expiry: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-02T00:00:00Z',
  })
  updatedAt: Date;
}
