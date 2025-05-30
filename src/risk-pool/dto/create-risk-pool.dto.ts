import { IsString, IsNotEmpty, IsIn, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateRiskPoolDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['ETH', 'USDC'])
  token: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  activeCoverage?: number;

  @IsOptional()
  @IsNumber()
  apy?: number;
}