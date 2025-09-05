/* eslint-disable prettier/prettier */

import { PaymentStatus } from '../entities/payment.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus, description: 'New payment status' })
  status: PaymentStatus;

  @ApiProperty({ description: 'Timestamp when payment was marked paid', required: false })
  paidAt?: Date;
}
