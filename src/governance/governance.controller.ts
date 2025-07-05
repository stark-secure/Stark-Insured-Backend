import {
  Controller,
  Get,
  Patch,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Body,
  Param,
  Query,
  Post,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { GovernanceService } from './governance.service';
import type { UpdateProposalDto } from './dto/update-proposal.dto';
import { ProposalResponseDto } from './dto/proposal-response.dto';
import { VoteReceiptResponseDto } from './dto/vote-receipt-response.dto';
import { ProposalResultResponseDto } from './dto/proposal-result-response.dto';
import { DaoMemberGuard } from './guards/dao-member.guard';
import { Proposal } from './entities/proposal.entity';
import { GetProposalsDto } from './dto/get-proposal.dto';
import { PaginatedProposalsDto } from './dto/paginated-proposal.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreateVoteDto, VoteResponseDto } from './dto/vote.dto';
import { UserService } from 'src/user/user.service';

@ApiTags('Governance')
@Controller('governance')
@UseGuards(DaoMemberGuard)
@ApiBearerAuth()
export class GovernanceController {
  constructor(
    private readonly governanceService: GovernanceService,
    private readonly userService: UserService,
  ) {}

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

  @Post('proposal')
  @ApiOperation({ summary: 'Create a new proposal' })
  @ApiResponse({
    status: 201,
    description: 'Proposal created successfully',
    type: Proposal,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  create(@Body() createProposalDto: CreateProposalDto): Promise<Proposal> {
    return this.governanceService.create(createProposalDto);
  }

  @Get('proposal')
  @ApiOperation({
    summary: 'Get all proposals with pagination, filtering, and sorting',
  })
  @ApiResponse({
    status: 200,
    description: 'Proposals retrieved successfully',
    type: PaginatedProposalsDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'active', 'passed', 'rejected', 'expired'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'expiryDate', 'voteCount'],
    description: 'Sort by field (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in title or description',
  })
  findAll(@Query() query: GetProposalsDto): Promise<PaginatedProposalsDto> {
    return this.governanceService.findAll(query);
  }

  @Get('proposal/:id')
  @ApiOperation({ summary: 'Get proposal by ID' })
  @ApiParam({ name: 'id', description: 'Proposal UUID' })
  @ApiResponse({
    status: 200,
    description: 'Proposal retrieved successfully',
    type: Proposal,
  })
  @ApiNotFoundResponse({ description: 'Proposal not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Proposal> {
    return this.governanceService.findOne(id);
  }

  @Patch('proposal/:id')
  @ApiOperation({ summary: 'Update proposal by ID' })
  @ApiParam({ name: 'id', description: 'Proposal UUID' })
  @ApiResponse({
    status: 200,
    description: 'Proposal updated successfully',
    type: Proposal,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Proposal not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProposalDto: UpdateProposalDto,
  ): Promise<Proposal> {
    return this.governanceService.update(id, updateProposalDto);
  }

  @Delete('proposal/:id')
  @ApiOperation({ summary: 'Delete proposal by ID' })
  @ApiParam({ name: 'id', description: 'Proposal UUID' })
  @ApiResponse({ status: 200, description: 'Proposal deleted successfully' })
  @ApiNotFoundResponse({ description: 'Proposal not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.governanceService.remove(id);
  }

  @Post('vote')
  @ApiOperation({ summary: 'Submit a vote on a proposal' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vote successfully submitted',
    type: VoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid vote data or proposal expired',
    type: ApiInternalServerErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User has already voted on this proposal',
    type: ApiInternalServerErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not authorized to vote',
    type: ApiInternalServerErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Proposal not found',
    type: ApiInternalServerErrorResponse,
  })
  async vote(
    @Body() createVoteDto: CreateVoteDto,
    @Request() req,
  ): Promise<VoteResponseDto> {
    const userId = req.user.id;
    const vote = await this.governanceService.vote(userId, createVoteDto);
    return {
      id: vote.id,
      proposalId: vote.proposal.id, // Access the ID from the proposal relation
      userId: vote.voter.id, // Access the ID from the user relation
      voteType: vote.vote, // Or whatever your vote type field is called
      createdAt: vote.createdAt,
    };
  }

  @Get('proposal/:id/tally')
  @ApiOperation({ summary: 'Get vote tally for a proposal' })
  @ApiParam({ name: 'id', description: 'Proposal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vote tally retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Proposal not found',
    type: ApiInternalServerErrorResponse,
  })
  async getVoteTally(@Param('id') proposalId: string) {
    return await this.governanceService.getVoteTally(proposalId);
  }

  @Get('proposal/:id')
  @ApiOperation({ summary: 'Get proposal details' })
  @ApiParam({ name: 'id', description: 'Proposal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Proposal retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Proposal not found',
    type: ApiInternalServerErrorResponse,
  })
  async getProposal(@Param('id') id: string) {
    return await this.governanceService.getProposal(id);
  }
}
