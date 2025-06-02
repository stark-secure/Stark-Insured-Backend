/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CastVoteDto, VoteType } from './dto/cast-vote.dto';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
  ) {}

  async createProposal(
    createProposalDto: CreateProposalDto,
    userId: string,
  ): Promise<Proposal> {
    const { title, description, startsAt, endsAt } = createProposalDto;

    // Validate dates
    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    const now = new Date();

    if (startDate <= now) {
      throw new BadRequestException('Start date must be in the future');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const proposal = this.proposalRepository.create({
      title,
      description,
      createdBy: userId,
      startsAt: startDate,
      endsAt: endDate,
      status: startDate <= now ? ProposalStatus.ACTIVE : ProposalStatus.PENDING,
    });

    return this.proposalRepository.save(proposal);
  }

  async castVote(castVoteDto: CastVoteDto, userId: string): Promise<void> {
    const { proposalId, voteType, tokenStake = 1, nftCount = 0 } = castVoteDto;

    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Check if proposal is active
    const now = new Date();
    if (proposal.status !== ProposalStatus.ACTIVE) {
      throw new BadRequestException('Proposal is not active for voting');
    }

    if (now < proposal.startsAt || now > proposal.endsAt) {
      throw new BadRequestException('Voting period has ended or not started');
    }

    // Prevent creator from voting on their own proposal
    if (proposal.createdBy === userId) {
      throw new ForbiddenException('Cannot vote on your own proposal');
    }

    // Calculate vote weight (stub implementation)
    const voteWeight = this.calculateVoteWeight(tokenStake, nftCount);

    // Update vote counts
    if (voteType === VoteType.FOR) {
      proposal.voteFor += voteWeight;
    } else {
      proposal.voteAgainst += voteWeight;
    }

    await this.proposalRepository.save(proposal);
  }

  async getProposals(): Promise<Proposal[]> {
    return this.proposalRepository.find({
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveProposals(): Promise<Proposal[]> {
    const now = new Date();
    return this.proposalRepository.find({
      where: {
        status: ProposalStatus.ACTIVE,
        startsAt: MoreThan(now),
        endsAt: MoreThan(now),
      },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  private calculateVoteWeight(tokenStake: number, nftCount: number): number {
    // Stub implementation for vote weight calculation
    // In production, this would integrate with StarkNet to verify actual holdings
    return Math.max(1, tokenStake + nftCount);
  }

  // Automated proposal lifecycle management
  // Remove the @Cron decorator and make this a regular method
  // @Cron(CronExpression.EVERY_MINUTE)
  async updateProposalStatuses(): Promise<void> {
    const now = new Date();

    // Activate pending proposals
    await this.proposalRepository.update(
      {
        status: ProposalStatus.PENDING,
        startsAt: MoreThan(now),
      },
      { status: ProposalStatus.ACTIVE },
    );

    // Close expired proposals
    const expiredProposals = await this.proposalRepository.find({
      where: {
        status: ProposalStatus.ACTIVE,
        endsAt: MoreThan(now),
      },
    });

    for (const proposal of expiredProposals) {
      const finalStatus =
        proposal.voteFor > proposal.voteAgainst
          ? ProposalStatus.PASSED
          : ProposalStatus.REJECTED;

      await this.proposalRepository.update(proposal.id, {
        status: finalStatus,
      });
    }
  }
}
