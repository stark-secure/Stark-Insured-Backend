import { PartialType } from '@nestjs/swagger';
import { CreateOracleDto } from './create-oracle.dto';

export class UpdateOracleDto extends PartialType(CreateOracleDto) {}
