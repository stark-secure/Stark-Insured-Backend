import { Test, TestingModule } from '@nestjs/testing';
import { DaoMemberGuard } from './dao-member.guard';
import { StarknetDaoService } from '../services/starknet-dao.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('DaoMemberGuard', () => {
  let guard: DaoMemberGuard;
  let starknetDaoService: StarknetDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DaoMemberGuard,
        {
          provide: StarknetDaoService,
          useValue: { isDaoMember: jest.fn() },
        },
      ],
    }).compile();
    guard = module.get(DaoMemberGuard);
    starknetDaoService = module.get(StarknetDaoService);
  });

  it('should allow access for valid DAO member', async () => {
    (starknetDaoService.isDaoMember as jest.Mock).mockResolvedValue(true);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { starknetAddress: '0x123' } }),
      }),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should deny access for non-member', async () => {
    (starknetDaoService.isDaoMember as jest.Mock).mockResolvedValue(false);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { starknetAddress: '0x123' } }),
      }),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should deny access if no user', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: undefined }),
      }),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should deny access if no starknetAddress', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { } }),
      }),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
