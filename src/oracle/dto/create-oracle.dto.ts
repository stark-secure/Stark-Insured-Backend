import { IsNumber, IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EventType {
  WALLET_EXPLOIT = 'wallet_exploit',
  PROTOCOL_DOWNTIME = 'protocol_downtime',
  SMART_CONTRACT_HACK = 'smart_contract_hack',
  PRICE_MANIPULATION = 'price_manipulation',
  BRIDGE_EXPLOIT = 'bridge_exploit',
  GOVERNANCE_ATTACK = 'governance_attack',
  OTHER = 'other'
}

export class OracleVerificationDto {
  @ApiProperty({
    description: 'ID of the claim to verify',
    example: 123
  })
  @IsNumber()
  claimId: number;

  @ApiProperty({
    description: 'Cryptographic signature from authorized oracle',
    example: '0x1234567890abcdef...'
  })
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Type of event being verified',
    enum: EventType,
    example: EventType.WALLET_EXPLOIT
  })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({
    description: 'Timestamp of the event in ISO format',
    example: '2024-01-15T10:30:00Z'
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Additional verification data',
    required: false,
    example: {
      transactionHash: '0xabc123...',
      blockNumber: 18500000,
      affectedAddress: '0xdef456...'
    }
  })
  @IsOptional()
  verificationData?: Record<string, any>;
}

export class CreateOracleDto extends OracleVerificationDto {}
