import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { PaymentService } from './services/payment.service';
import { WebhookService } from './services/webhook.service';
import { Payment } from './entities/payment.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { EthereumPaymentService } from './services/payment-processors/ethereum-payment.service';
import { StarkNetPaymentService } from './services/payment-processors/starknet-payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, WebhookLog]),
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    PaymentService,
    WebhookService,
    EthereumPaymentService,
    StarkNetPaymentService,
  ],
  exports: [PaymentService, WebhookService],
})
export class MultiPaymentsModule {} 