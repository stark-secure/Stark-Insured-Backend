import { IsNumber, IsString } from 'class-validator';

export class BurnLpTokenDto {
  @IsString()
  tokenId: string;

  @IsNumber()
  amount: number;
}