import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Proposal } from './entities/proposal.entity';
import { Vote } from './entities/vote.entity';
import type { UpdateProposalDto } from './dto/update-proposal.dto';
import type { ProposalResponseDto } from './dto/proposal-response.dto';
import type { VoteReceiptResponseDto } from './dto/vote-receipt-response.dto';
import type { ProposalResultResponseDto } from './dto/proposal-result-response.dto';
import { GetProposalsDto } from './dto/get-proposal.dto';
import { PaginatedProposalsDto } from './dto/paginated-proposal.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DuplicateVoteException,
  ProposalExpiredException,
  ProposalNotFoundException,
  UnauthorizedVoterException,
} from './exception/governance.exception';
import { CreateVoteDto } from './dto/vote.dto';
import { User } from 'src/user/entities/user.entity';
import { VoteType } from './dto/cast-vote.dto';

@Injectable()
export class GovernanceService {
  private proposalRepository: Repository<Proposal>;
  private voteRepository: Repository<Vote>;
  private userRepository: Repository<User>;

  constructor(
    @InjectRepository(Proposal)
    proposalRepository: Repository<Proposal>,

    @InjectRepository(Vote)
    voteRepository: Repository<Vote>,

    @InjectRepository(User)
    userRepository: Repository<User>,

    private readonly logger = new Logger(GovernanceService.name),
  ) {
    this.proposalRepository = proposalRepository;
    this.voteRepository = voteRepository;
    this.userRepository = userRepository; // Add this missing assignment
  }

  async updateProposal(
    id: string,
    updateProposalDto: UpdateProposalDto,
    userId: string,
  ): Promise<ProposalResponseDto> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!proposal) {
      throw new HttpException('Proposal not found', HttpStatus.NOT_FOUND);
    }

    // Check if user is the creator
    if (proposal.createdBy !== userId) {
      throw new HttpException(
        'Only the proposal creator can update this proposal',
        HttpStatus.FORBIDDEN,
      );
    }

    // Check if voting has started
    if (this.hasVotingStarted(proposal)) {
      throw new HttpException(
        'Cannot update proposal after voting has started',
        HttpStatus.FORBIDDEN,
      );
    }

    // Update only allowed fields
    const updatedProposal = await this.proposalRepository.save({
      ...proposal,
      title: updateProposalDto.title ?? proposal.title,
      description: updateProposalDto.description ?? proposal.description,
      expiry: updateProposalDto.expiryDate ?? proposal.expiryDate,
      updatedAt: new Date(),
    });

    return this.mapToProposalResponse(updatedProposal);
  }

  async deleteProposal(id: string, userId: string): Promise<void> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!proposal) {
      throw new HttpException('Proposal not found', HttpStatus.NOT_FOUND);
    }

    // Check if user is the creator
    if (proposal.createdBy !== userId) {
      throw new HttpException(
        'Only the proposal creator can delete this proposal',
        HttpStatus.FORBIDDEN,
      );
    }

    // Check if voting has started
    if (this.hasVotingStarted(proposal)) {
      throw new HttpException(
        'Cannot delete proposal after voting has started',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.proposalRepository.remove(proposal);
  }

  async getVoteReceipt(
    proposalId: string,
    userId: string,
  ): Promise<VoteReceiptResponseDto> {
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new HttpException('Proposal not found', HttpStatus.NOT_FOUND);
    }

    const vote = await this.voteRepository.findOne({
      where: {
        proposal: { id: proposalId },
        voter: { id: userId },
      },
      relations: ['voter'],
    });

    if (!vote) {
      return {
        proposalId,
        userId,
        hasVoted: false,
        voteOption: null,
        votedAt: null,
      };
    }

    return {
      proposalId,
      userId,
      hasVoted: true,
      voteOption: vote.option,
      votedAt: vote.createdAt,
    };
  }

  async getProposalResult(
    proposalId: string,
  ): Promise<ProposalResultResponseDto> {
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new HttpException('Proposal not found', HttpStatus.NOT_FOUND);
    }

    // Check if voting period has ended
    if (!this.hasVotingEnded(proposal)) {
      throw new HttpException(
        'Voting period has not ended yet',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Get all votes for this proposal
    const votes = await this.voteRepository.find({
      where: { proposal: { id: proposalId } },
    });

    // Calculate vote tallies
    const voteTally = votes.reduce(
      (acc, vote) => {
        acc[vote.option] = (acc[vote.option] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalVotes = votes.length;
    const yesVotes = voteTally['yes'] || 0;
    const noVotes = voteTally['no'] || 0;

    // Determine if proposal passed (simple majority)
    const passed = yesVotes > noVotes;

    return {
      proposalId,
      title: proposal.title,
      votingEnded: true,
      totalVotes,
      voteTally,
      passed,
      finalizedAt: new Date(),
    };
  }

  private hasVotingStarted(proposal: Proposal): boolean {
    // Assuming voting starts immediately when proposal is created
    // You can modify this logic based on your business rules
    const votes = proposal.voteCount || [];

    // Check if votes is an array before using .length
    if (Array.isArray(votes)) {
      return votes.length > 0;
    }

    // If it's a number, check if it's greater than 0
    return votes > 0;
  }

  private hasVotingEnded(proposal: Proposal): boolean {
    return new Date() > proposal.expiryDate;
  }

  private mapToProposalResponse(proposal: Proposal): ProposalResponseDto {
    return {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      creatorId: proposal.createdBy,
      expiry: proposal.expiryDate,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    };
  }

  async create(createProposalDto: CreateProposalDto): Promise<Proposal> {
    // Validate date range
    if (createProposalDto.startDate >= createProposalDto.expiryDate) {
      throw new BadRequestException('Start date must be before expiry date');
    }

    const proposal = this.proposalRepository.create(createProposalDto);
    return this.proposalRepository.save(proposal);
  }

  async findAll(query: GetProposalsDto): Promise<PaginatedProposalsDto> {
    const { page, limit, status, sortBy, sortOrder, search } = query;

    const queryBuilder = this.proposalRepository.createQueryBuilder('proposal');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('proposal.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(proposal.title ILIKE :search OR proposal.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    const sortField = this.getSortField(sortBy);
    queryBuilder.orderBy(`proposal.${sortField}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [proposals, totalCount] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: proposals,
      totalCount,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({ where: { id } });
    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }
    return proposal;
  }

  async update(
    id: string,
    updateProposalDto: UpdateProposalDto,
  ): Promise<Proposal> {
    const proposal = await this.findOne(id);

    // Validate date range if both dates are provided
    const startDate = updateProposalDto.startDate || proposal.startDate;
    const expiryDate = updateProposalDto.expiryDate || proposal.expiryDate;

    if (startDate >= expiryDate) {
      throw new BadRequestException('Start date must be before expiry date');
    }

    Object.assign(proposal, updateProposalDto);
    return this.proposalRepository.save(proposal);
  }

  async remove(id: string): Promise<void> {
    const proposal = await this.findOne(id);
    await this.proposalRepository.remove(proposal);
  }

  private getSortField(sortBy: string): string {
    const sortFields = {
      createdAt: 'createdAt',
      expiryDate: 'expiryDate',
      voteCount: 'voteCount',
    };
    return sortFields[sortBy] || 'createdAt';
  }

  async vote(userId: string, createVoteDto: CreateVoteDto): Promise<Vote> {
    const { proposalId, voteType } = createVoteDto;

    // Check if user is DAO member (mock implementation)
    await this.validateDAOMember(userId);

    // Check if proposal exists
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new ProposalNotFoundException(proposalId);
    }

    // Check if proposal is expired
    if (proposal.expiryDate) {
      throw new ProposalExpiredException(proposalId);
    }

    // Get user entity
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(userId);
    }

    // Check for duplicate vote - use the correct property names
    const existingVote = await this.voteRepository.findOne({
      where: {
        proposal: { id: proposalId },
        voter: { id: userId }, // Changed from 'user' to 'voter'
      },
      relations: ['proposal', 'voter'],
    });

    if (existingVote) {
      throw new DuplicateVoteException(proposalId, userId);
    }

    // Create and save vote - use the correct property names
    const vote = this.voteRepository.create({
      proposal,
      voter: user, // Changed from 'user' to 'voter'
      vote: voteType,
    });

    const savedVote = await this.voteRepository.save(vote);

    // Load the vote with relations for response
    const voteWithRelations = await this.voteRepository.findOne({
      where: { id: savedVote.id },
      relations: ['proposal', 'voter'], // Changed from 'user' to 'voter'
    });

    this.logger.log(`Vote created: ${savedVote.id} by user ${userId}`);

    return voteWithRelations;
  }

  async getVoteTally(proposalId: string): Promise<{
    for: number;
    against: number;
    abstain: number;
    total: number;
  }> {
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new ProposalNotFoundException(proposalId);
    }

    // Use QueryBuilder for more efficient counting
    const voteCount = await this.voteRepository
      .createQueryBuilder('vote')
      .select('vote.vote', 'voteType') // Use 'vote' instead of 'voteType'
      .addSelect('COUNT(*)', 'count')
      .where('vote.proposalId = :proposalId', { proposalId })
      .groupBy('vote.vote')
      .getRawMany();

    const tally = {
      for: 0,
      against: 0,
      abstain: 0,
      total: 0,
    };

    voteCount.forEach((result) => {
      const count = parseInt(result.count);
      switch (result.voteType) {
        case VoteType.FOR:
          tally.for = count;
          break;
        case VoteType.AGAINST:
          tally.against = count;
          break;
        case VoteType.ABSTAIN:
          tally.abstain = count;
          break;
      }
      tally.total += count;
    });

    return tally;
  }

  private async validateDAOMember(userId: string): Promise<void> {
    // Mock DAO member validation - replace with actual logic
    const daoMembers = ['user1', 'user2', 'user3']; // This would come from database

    if (!daoMembers.includes(userId)) {
      throw new UnauthorizedVoterException(userId);
    }
  }

  async getProposal(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['votes'],
    });

    if (!proposal) {
      throw new ProposalNotFoundException(id);
    }

    return proposal;
  }
}
