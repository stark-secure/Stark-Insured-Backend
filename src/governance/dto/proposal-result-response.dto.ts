import { ApiProperty } from '@nestjs/swagger';

export class ProposalResultResponseDto {
  @ApiProperty({
    description: 'Proposal ID',
    example: 'proposal-uuid',
  })
  proposalId: string;

  @ApiProperty({
    description: 'Proposal title',
    example: 'Increase DAO Treasury Allocation',
  })
  title: string;

  @ApiProperty({
    description: 'Whether voting has ended',
    example: true,
  })
  votingEnded: boolean;

  @ApiProperty({
    description: 'Total number of votes cast',
    example: 150,
  })
  totalVotes: number;

  @ApiProperty({
    description: 'Vote tally by option',
    example: { yes: 95, no: 55 },
  })
  voteTally: Record<string, number>;

  @ApiProperty({
    description: 'Whether the proposal passed',
    example: true,
  })
  passed: boolean;

  @ApiProperty({
    description: 'Timestamp when results were finalized',
    example: '2024-01-31T23:59:59Z',
  })
  finalizedAt: Date;
}
