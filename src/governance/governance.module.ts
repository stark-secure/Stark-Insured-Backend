/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { Proposal } from './entities/proposal.entity';
import { DaoMemberGuard } from './guards/dao-member.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal]), ScheduleModule.forRoot()],
  controllers: [ProposalController],
  providers: [ProposalService, DaoMemberGuard],
  exports: [ProposalService],
})
export class GovernanceModule {}
