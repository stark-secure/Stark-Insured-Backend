/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { Proposal } from './entities/proposal.entity';
import { DaoMemberGuard } from './guards/dao-member.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal])],
  controllers: [ProposalController],
  providers: [ProposalService, DaoMemberGuard],
  exports: [ProposalService],
})
export class GovernanceModule {}
