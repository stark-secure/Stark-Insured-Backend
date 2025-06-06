import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LPToken } from './lp-token.entity';
import { LpTokenService } from './lp-token.service';
import { LpTokenController } from './lp-token.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LPToken])],
  providers: [LpTokenService],
  controllers: [LpTokenController],
})
export class LpTokenModule {}