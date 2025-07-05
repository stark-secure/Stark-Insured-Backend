/* eslint-disable prettier/prettier */
import { IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export enum VoteType {
  FOR = 'for',
  AGAINST = 'against',
  ABSTAIN = 'abstain',
}

export class CastVoteDto {
  @IsNumber()
  proposalId: number;

  @IsEnum(VoteType)
  voteType: VoteType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  tokenStake?: number; // DAO token stake (stub implementation)

  @IsOptional()
  @IsNumber()
  nftCount?: number; // NFT holdings count (stub implementation)
}
