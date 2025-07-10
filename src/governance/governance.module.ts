import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { Proposal } from './entities/proposal.entity';
import { Vote } from './entities/vote.entity';
import { DaoMemberGuard } from './guards/dao-member.guard';
import { StarknetDaoService } from './services/starknet-dao.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposal, Vote]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [GovernanceController],
  providers: [GovernanceService, DaoMemberGuard, StarknetDaoService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
