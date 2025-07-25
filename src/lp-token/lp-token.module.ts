import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LPToken } from './lp-token.entity';
import { LpTokenService } from './lp-token.service';
import { LpTokenController } from './lp-token.controller';
import { LPTokenEvent } from './lp-token-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LPToken, LPTokenEvent])],
  providers: [LpTokenService],
  controllers: [LpTokenController],
})
export class LpTokenModule {}