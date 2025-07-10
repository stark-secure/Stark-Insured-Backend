import { Test, TestingModule } from '@nestjs/testing';
import { ProposalService } from './proposal.service';
import { Repository } from 'typeorm';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VoteType } from './dto/cast-vote.dto';

describe('ProposalService', () => {
  let service: ProposalService;
  let repo: Repository<Proposal>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalService,
        {
          provide: getRepositoryToken(Proposal),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(ProposalService);
    repo = module.get(getRepositoryToken(Proposal));
  });

  it('should expire proposals after expiryDate', async () => {
    const now = new Date();
    const expiredProposal = { id: '1', status: ProposalStatus.ACTIVE, expiryDate: new Date(now.getTime() - 1000) } as Proposal;
    (repo.find as jest.Mock).mockResolvedValue([expiredProposal]);
    (repo.update as jest.Mock).mockResolvedValue(undefined);
    await service.updateProposalStatuses();
    expect(repo.update).toHaveBeenCalledWith('1', { status: ProposalStatus.EXPIRED });
  });

  it('should block voting on expired proposals', async () => {
    const now = new Date();
    const expiredProposal = {
      id: 1,
      status: ProposalStatus.EXPIRED,
      expiryDate: new Date(now.getTime() - 1000),
      startDate: new Date(now.getTime() - 2000),
      createdBy: 'user1',
      title: 'Test',
      description: 'Test description that is long enough to pass validation.',
      votes: [],
      voteCount: 0,
      createdAt: now,
      updatedAt: now
    } as unknown as Proposal;
    (repo.findOne as jest.Mock).mockResolvedValue(expiredProposal);
    await expect(service.castVote({ proposalId: 1, voteType: VoteType.FOR }, 'user2')).rejects.toThrow();
  });
});
