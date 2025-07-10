import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OracleService } from './oracle.service';
import { OracleController } from './oracle.controller';
import { OracleGuard } from './guards/oracle.guard';
import { Claim } from '../claim/entities/claim.entity';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([Claim]),
  ],
  controllers: [OracleController],
  providers: [OracleService, OracleGuard],
  exports: [OracleService],
})
export class OracleModule {}
