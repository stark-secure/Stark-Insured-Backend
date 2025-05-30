/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { Policy } from 'src/policy/policy.entity';
import { PolicyService } from 'src/policy/policy.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Policy])],
  providers: [PaymentService, PolicyService],
  controllers: [PaymentController],
})
export class PaymentModule {}
