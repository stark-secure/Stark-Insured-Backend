import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';
import { ClaimNotificationService } from './notification.service';
import { Claim } from './entities/claim.entity';
import { OracleModule } from '../oracle/oracle.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Claim]), OracleModule, MailModule, UserModule],
  controllers: [ClaimController],
  providers: [ClaimService, ClaimNotificationService],
  exports: [ClaimService, ClaimNotificationService],
})
export class ClaimModule {}