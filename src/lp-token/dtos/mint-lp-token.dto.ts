import { IsNumber } from 'class-validator';

export class MintLpTokenDto {
  @IsNumber()
  amount: number;

  @IsNumber()
  poolId: number;
}