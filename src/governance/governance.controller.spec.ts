import { Test, type TestingModule } from '@nestjs/testing';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import type { UpdateProposalDto } from './dto/update-proposal.dto';
import { jest } from '@jest/globals';

describe('GovernanceController', () => {
  let controller: GovernanceController;
  let service: GovernanceService;

  const mockGovernanceService = {
    updateProposal: jest.fn(),
    deleteProposal: jest.fn(),
    getVoteReceipt: jest.fn(),
    getProposalResult: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GovernanceController],
      providers: [
        {
          provide: GovernanceService,
          useValue: mockGovernanceService,
        },
      ],
    }).compile();

    controller = module.get<GovernanceController>(GovernanceController);
    service = module.get<GovernanceService>(GovernanceService);
  });

  describe('updateProposal', () => {
    it('should update a proposal successfully', async () => {
      const proposalId = 'test-id';
      const updateDto: UpdateProposalDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      const userId = 'user-id';
      const expectedResult = {
        id: proposalId,
        title: 'Updated Title',
        description: 'Updated Description',
        creatorId: userId,
        expiry: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGovernanceService.updateProposal.mockResolvedValue(expectedResult);

      const result = await controller.updateProposal(proposalId, updateDto, {
        user: { id: userId },
      });

      expect(service.updateProposal).toHaveBeenCalledWith(
        proposalId,
        updateDto,
        userId,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteProposal', () => {
    it('should delete a proposal successfully', async () => {
      const proposalId = 'test-id';
      const userId = 'user-id';

      mockGovernanceService.deleteProposal.mockResolvedValue(undefined);

      const result = await controller.deleteProposal(proposalId, {
        user: { id: userId },
      });

      expect(service.deleteProposal).toHaveBeenCalledWith(proposalId, userId);
      expect(result).toEqual({ message: 'Proposal deleted successfully' });
    });
  });

  describe('getVoteReceipt', () => {
    it('should return vote receipt for user', async () => {
      const proposalId = 'proposal-id';
      const userId = 'user-id';
      const expectedReceipt = {
        proposalId,
        userId,
        hasVoted: true,
        voteOption: 'yes',
        votedAt: new Date(),
      };

      mockGovernanceService.getVoteReceipt.mockResolvedValue(expectedReceipt);

      const result = await controller.getVoteReceipt(proposalId, userId);

      expect(service.getVoteReceipt).toHaveBeenCalledWith(proposalId, userId);
      expect(result).toEqual(expectedReceipt);
    });
  });

  describe('getProposalResult', () => {
    it('should return proposal results', async () => {
      const proposalId = 'proposal-id';
      const expectedResult = {
        proposalId,
        title: 'Test Proposal',
        votingEnded: true,
        totalVotes: 100,
        voteTally: { yes: 60, no: 40 },
        passed: true,
        finalizedAt: new Date(),
      };

      mockGovernanceService.getProposalResult.mockResolvedValue(expectedResult);

      const result = await controller.getProposalResult(proposalId);

      expect(service.getProposalResult).toHaveBeenCalledWith(proposalId);
      expect(result).toEqual(expectedResult);
    });
  });
});
