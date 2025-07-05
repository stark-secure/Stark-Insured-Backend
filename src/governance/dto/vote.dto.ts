import { IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VoteType } from './cast-vote.dto';

export class CreateVoteDto {
  @ApiProperty({
    description: 'The ID of the proposal to vote on',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  proposalId: string;

  @ApiProperty({
    description: 'The type of vote',
    enum: VoteType,
    example: VoteType.FOR,
  })
  @IsEnum(VoteType)
  voteType: VoteType;
}

export class VoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  proposalId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: VoteType })
  voteType: VoteType;

  @ApiProperty()
  createdAt: Date;
}
