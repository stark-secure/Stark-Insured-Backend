import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { Proposal } from './entities/proposal.entity';
import { Vote } from './entities/vote.entity';
import { jest } from '@jest/globals';

describe('GovernanceService', () => {
  let service: GovernanceService;
  let proposalRepository: Repository<Proposal>;
  let voteRepository: Repository<Vote>;

  const mockProposalRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockVoteRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceService,
        {
          provide: getRepositoryToken(Proposal),
          useValue: mockProposalRepository,
        },
        {
          provide: getRepositoryToken(Vote),
          useValue: mockVoteRepository,
        },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
    proposalRepository = module.get<Repository<Proposal>>(
      getRepositoryToken(Proposal),
    );
    voteRepository = module.get<Repository<Vote>>(getRepositoryToken(Vote));
  });

  describe('updateProposal', () => {
    it('should update proposal successfully', async () => {
      const proposalId = 'test-id';
      const userId = 'user-id';
      const updateDto = { title: 'Updated Title' };

      const mockProposal = {
        id: proposalId,
        title: 'Original Title',
        description: 'Original Description',
        creator: { id: userId },
        expiry: new Date(Date.now() + 86400000), // 1 day from now
        votes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProposalRepository.findOne.mockResolvedValue(mockProposal);
      mockProposalRepository.save.mockResolvedValue({
        ...mockProposal,
        ...updateDto,
      });

      const result = await service.updateProposal(
        proposalId,
        updateDto,
        userId,
      );

      expect(proposalRepository.findOne).toHaveBeenCalledWith({
        where: { id: proposalId },
        relations: ['creator'],
      });
      expect(result.title).toBe(updateDto.title);
    });

    it('should throw error if proposal not found', async () => {
      mockProposalRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProposal('non-existent', {}, 'user-id'),
      ).rejects.toThrow(
        new HttpException('Proposal not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw error if user is not creator', async () => {
      const mockProposal = {
        id: 'test-id',
        creator: { id: 'different-user' },
        votes: [],
      };

      mockProposalRepository.findOne.mockResolvedValue(mockProposal);

      await expect(
        service.updateProposal('test-id', {}, 'user-id'),
      ).rejects.toThrow(
        new HttpException(
          'Only the proposal creator can update this proposal',
          HttpStatus.FORBIDDEN,
        ),
      );
    });
  });

  describe('getVoteReceipt', () => {
    it('should return vote receipt when user has voted', async () => {
      const proposalId = 'proposal-id';
      const userId = 'user-id';

      const mockProposal = { id: proposalId };
      const mockVote = {
        option: 'yes',
        createdAt: new Date(),
        voter: { id: userId },
      };

      mockProposalRepository.findOne.mockResolvedValue(mockProposal);
      mockVoteRepository.findOne.mockResolvedValue(mockVote);

      const result = await service.getVoteReceipt(proposalId, userId);

      expect(result).toEqual({
        proposalId,
        userId,
        hasVoted: true,
        voteOption: 'yes',
        votedAt: mockVote.createdAt,
      });
    });

    it('should return no vote receipt when user has not voted', async () => {
      const proposalId = 'proposal-id';
      const userId = 'user-id';

      const mockProposal = { id: proposalId };

      mockProposalRepository.findOne.mockResolvedValue(mockProposal);
      mockVoteRepository.findOne.mockResolvedValue(null);

      const result = await service.getVoteReceipt(proposalId, userId);

      expect(result).toEqual({
        proposalId,
        userId,
        hasVoted: false,
        voteOption: null,
        votedAt: null,
      });
    });
  });

  describe('getProposalResult', () => {
    it('should return proposal results after voting ends', async () => {
      const proposalId = 'proposal-id';
      const pastDate = new Date(Date.now() - 86400000); // 1 day ago

      const mockProposal = {
        id: proposalId,
        title: 'Test Proposal',
        expiry: pastDate,
      };

      const mockVotes = [
        { option: 'yes' },
        { option: 'yes' },
        { option: 'no' },
      ];

      mockProposalRepository.findOne.mockResolvedValue(mockProposal);
      mockVoteRepository.find.mockResolvedValue(mockVotes);

      const result = await service.getProposalResult(proposalId);

      expect(result).toEqual({
        proposalId,
        title: 'Test Proposal',
        votingEnded: true,
        totalVotes: 3,
        voteTally: { yes: 2, no: 1 },
        passed: true,
        finalizedAt: expect.any(Date),
      });
    });

    it('should throw error if voting has not ended', async () => {
      const proposalId = 'proposal-id';
      const futureDate = new Date(Date.now() + 86400000); // 1 day from now

      const mockProposal = {
        id: proposalId,
        expiry: futureDate,
      };

      mockProposalRepository.findOne.mockResolvedValue(mockProposal);

      await expect(service.getProposalResult(proposalId)).rejects.toThrow(
        new HttpException(
          'Voting period has not ended yet',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
