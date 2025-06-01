/* eslint-disable prettier/prettier */
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;
}
