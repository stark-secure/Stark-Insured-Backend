/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
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
    const { title, description, startDate, expiryDate } = createProposalDto;
    const now = new Date();
    if (startDate <= now) {
      throw new BadRequestException('Start date must be in the future');
    }
    if (expiryDate <= startDate) {
      throw new BadRequestException('Expiry date must be after start date');
    }
    const proposal = this.proposalRepository.create({
      title,
      description,
      createdBy: userId,
      startDate,
      expiryDate,
      status: ProposalStatus.DRAFT,
    });
    return this.proposalRepository.save(proposal);
  }

  async castVote(castVoteDto: CastVoteDto, userId: string): Promise<void> {
    const { proposalId, voteType, tokenStake = 1, nftCount = 0 } = castVoteDto;
    const proposal = await this.proposalRepository.findOne({
      where: { id: String(proposalId) },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    const now = new Date();
    if (proposal.status !== ProposalStatus.ACTIVE || now > proposal.expiryDate) {
      throw new BadRequestException('Proposal is not active for voting or has expired');
    }
    if (now < proposal.startDate) {
      throw new BadRequestException('Voting period has not started');
    }
    if (proposal.createdBy === userId) {
      throw new ForbiddenException('Cannot vote on your own proposal');
    }
    // Update vote count (simple increment for now)
    proposal.voteCount = (proposal.voteCount || 0) + 1;
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
        startDate: MoreThan(now),
        expiryDate: MoreThan(now),
      },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateProposalStatuses(): Promise<void> {
    const now = new Date();
    // Expire proposals past their expiryDate
    const toExpire = await this.proposalRepository.find({
      where: {
        status: ProposalStatus.ACTIVE,
        expiryDate: LessThan(now),
      },
    });
    for (const proposal of toExpire) {
      await this.proposalRepository.update(proposal.id, {
        status: ProposalStatus.EXPIRED,
      });
    }
  }
}
