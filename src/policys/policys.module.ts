import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from './entities/policy.entity';
import { PolicyController } from './policys.controller';
import { PolicyService } from './policys.service';

@Module({
  imports: [TypeOrmModule.forFeature([Policy])],
  controllers: [PolicyController],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicysModule {}
