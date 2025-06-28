import { Module } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { OracleController } from './oracle.controller';

@Module({
  controllers: [OracleController],
  providers: [OracleService],
})
export class OracleModule {}
