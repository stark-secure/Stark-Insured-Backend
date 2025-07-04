import { ApiProperty } from '@nestjs/swagger';
import { Proposal } from '../entities/proposal.entity';

export class PaginatedProposalsDto {
  @ApiProperty({ type: [Proposal] })
  data: Proposal[];

  @ApiProperty({ description: 'Total number of proposals' })
  totalCount: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}
