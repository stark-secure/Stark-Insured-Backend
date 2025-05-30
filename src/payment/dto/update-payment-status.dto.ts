/* eslint-disable prettier/prettier */

import { PaymentStatus } from '../entities/payment.entity';

export class UpdatePaymentStatusDto {
  status: PaymentStatus;
  paidAt?: Date;
}
