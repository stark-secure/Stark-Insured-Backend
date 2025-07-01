import { ApiProperty } from '@nestjs/swagger';

export class VoteReceiptResponseDto {
  @ApiProperty({
    description: 'Proposal ID',
    example: 'proposal-uuid',
  })
  proposalId: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user-uuid',
  })
  userId: string;

  @ApiProperty({
    description: 'Whether the user has voted',
    example: true,
  })
  hasVoted: boolean;

  @ApiProperty({
    description: 'Vote option selected (null if not voted)',
    example: 'yes',
    nullable: true,
  })
  voteOption: string | null;

  @ApiProperty({
    description: 'Timestamp when vote was cast (null if not voted)',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  votedAt: Date | null;
}
