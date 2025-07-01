import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Proposal } from './entities/proposal.entity';
import type { Vote } from './entities/vote.entity';
import type { UpdateProposalDto } from './dto/update-proposal.dto';
import type { ProposalResponseDto } from './dto/proposal-response.dto';
import type { VoteReceiptResponseDto } from './dto/vote-receipt-response.dto';
import type { ProposalResultResponseDto } from './dto/proposal-result-response.dto';

@Injectable()
export class GovernanceService {
  private proposalRepository: Repository<Proposal>;
  private voteRepository: Repository<Vote>;

  constructor(
    proposalRepository: Repository<Proposal>,
    voteRepository: Repository<Vote>,
  ) {
    this.proposalRepository = proposalRepository;
    this.voteRepository = voteRepository;
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
    if (proposal.creator.id !== userId) {
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
      expiry: updateProposalDto.expiry ?? proposal.expiry,
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
    if (proposal.creator.id !== userId) {
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
    const votes = proposal.votes || [];
    return votes.length > 0;
  }

  private hasVotingEnded(proposal: Proposal): boolean {
    return new Date() > proposal.expiry;
  }

  private mapToProposalResponse(proposal: Proposal): ProposalResponseDto {
    return {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      creatorId: proposal.creator.id,
      expiry: proposal.expiry,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    };
  }
}
