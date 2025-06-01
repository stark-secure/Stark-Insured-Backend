/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DaoMemberGuard } from './guards/dao-member.guard';
import { Proposal } from './entities/proposal.entity';
import { User } from '../user/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('governance')
@Controller('governance')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post('proposal')
  @UseGuards(JwtAuthGuard, DaoMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new proposal' })
  @ApiResponse({ status: 201, description: 'Proposal created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid proposal data' })
  @ApiResponse({ status: 403, description: 'DAO membership required' })
  async createProposal(
    @Body() createProposalDto: CreateProposalDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Proposal> {
    return this.proposalService.createProposal(createProposalDto, req.user.id);
  }

  @Post('vote')
  @UseGuards(JwtAuthGuard, DaoMemberGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cast a vote on a proposal' })
  @ApiResponse({ status: 200, description: 'Vote cast successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid vote data or voting period ended',
  })
  @ApiResponse({ status: 403, description: 'DAO membership required' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async castVote(
    @Body() castVoteDto: CastVoteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.proposalService.castVote(castVoteDto, req.user.id);
  }

  @Get('proposal')
  @ApiOperation({ summary: 'View active and past proposals' })
  @ApiResponse({ status: 200, description: 'Proposals retrieved successfully' })
  async getProposals(): Promise<Proposal[]> {
    return this.proposalService.getProposals();
  }

  @Get('proposal/active')
  @ApiOperation({ summary: 'View only active proposals' })
  @ApiResponse({
    status: 200,
    description: 'Active proposals retrieved successfully',
  })
  async getActiveProposals(): Promise<Proposal[]> {
    return this.proposalService.getActiveProposals();
  }
}
