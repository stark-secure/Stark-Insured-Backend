import { Controller, Get, Patch, Delete, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { GovernanceService } from './governance.service';
import type { UpdateProposalDto } from './dto/update-proposal.dto';
import { ProposalResponseDto } from './dto/proposal-response.dto';
import { VoteReceiptResponseDto } from './dto/vote-receipt-response.dto';
import { ProposalResultResponseDto } from './dto/proposal-result-response.dto';
import { DaoMemberGuard } from './guards/dao-member.guard';

@ApiTags('Governance')
@Controller('governance')
@UseGuards(DaoMemberGuard)
@ApiBearerAuth()
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Patch('proposal/:id')
  @ApiOperation({
    summary: 'Update a proposal',
    description:
      'Allow the original creator to update a proposal only before voting begins',
  })
  @ApiParam({
    name: 'id',
    description: 'Proposal ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Proposal updated successfully',
    type: ProposalResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the proposal creator or voting has started',
  })
  @ApiResponse({
    status: 404,
    description: 'Proposal not found',
  })
  async updateProposal(
    id: string,
    updateProposalDto: UpdateProposalDto,
    req: any,
  ): Promise<ProposalResponseDto> {
    return this.governanceService.updateProposal(
      id,
      updateProposalDto,
      req.user.id,
    );
  }

  @Delete('proposal/:id')
  @ApiOperation({
    summary: 'Delete a proposal',
    description:
      'Allow deletion of proposals only by the creator and only before voting starts',
  })
  @ApiParam({
    name: 'id',
    description: 'Proposal ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Proposal deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the proposal creator or voting has started',
  })
  @ApiResponse({
    status: 404,
    description: 'Proposal not found',
  })
  async deleteProposal(id: string, req: any): Promise<{ message: string }> {
    await this.governanceService.deleteProposal(id, req.user.id);
    return { message: 'Proposal deleted successfully' };
  }

  @Get('proposal/:id/vote-receipt')
  @ApiOperation({
    summary: 'Get vote receipt for a user',
    description:
      'Returns whether the user voted, what option they selected, and when',
  })
  @ApiParam({
    name: 'id',
    description: 'Proposal ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'user',
    description: 'User ID to get vote receipt for',
    type: 'string',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Vote receipt retrieved successfully',
    type: VoteReceiptResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Proposal not found',
  })
  async getVoteReceipt(
    proposalId: string,
    userId?: string,
    req?: any,
  ): Promise<VoteReceiptResponseDto> {
    const targetUserId = userId || req.user.id;
    return this.governanceService.getVoteReceipt(proposalId, targetUserId);
  }

  @Get('proposal/:id/result')
  @ApiOperation({
    summary: 'Get proposal results',
    description: 'Returns the final tally after the voting period ends',
  })
  @ApiParam({
    name: 'id',
    description: 'Proposal ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Proposal results retrieved successfully',
    type: ProposalResultResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Voting period has not ended yet',
  })
  @ApiResponse({
    status: 404,
    description: 'Proposal not found',
  })
  async getProposalResult(
    proposalId: string,
  ): Promise<ProposalResultResponseDto> {
    return this.governanceService.getProposalResult(proposalId);
  }
}
