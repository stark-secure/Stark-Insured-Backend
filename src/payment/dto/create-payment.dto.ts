/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Amount to pay', example: 100.5 })
  amount: number;

  @ApiProperty({ description: 'Token/currency used for payment', example: 'USDC' })
  token: string;

  @ApiProperty({ description: 'Policy id this payment applies to', example: 42 })
  policyId: number;
}
