import { ApiProperty } from '@nestjs/swagger';

export class OracleVerificationResponseDto {
  @ApiProperty({
    description: 'Whether the verification was successful',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'ID of the verified claim',
    example: 123
  })
  claimId: number;

  @ApiProperty({
    description: 'Verification status message',
    example: 'Claim successfully verified by oracle'
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp when verification was processed',
    example: '2024-01-15T10:35:00Z'
  })
  verifiedAt: string;

  @ApiProperty({
    description: 'Oracle signature verification result',
    example: true
  })
  signatureValid: boolean;

  @ApiProperty({
    description: 'Additional verification metadata',
    required: false,
    example: {
      oracleId: 'oracle-001',
      eventConfirmed: true,
      confidenceScore: 0.95
    }
  })
  metadata?: Record<string, any>;
}

export class OraclePayload {
  claimId: number;
  signature: string;
  eventType: string;
  timestamp: string;
  verificationData?: Record<string, any>;
  oracleId?: string;
}
