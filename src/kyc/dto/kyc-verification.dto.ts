import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsBase64,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export enum DocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  DRIVERS_LICENSE = 'drivers_license',
}

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class KycVerificationRequestDto {
  @ApiProperty({
    description: 'Full legal name as it appears on the document',
    example: 'John Michael Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'Date of birth in ISO format (YYYY-MM-DD)',
    example: '1990-05-15',
  })
  @IsDateString()
  dob: string;

  @ApiProperty({
    description: 'National identification number',
    example: 'A1234567890',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'National ID must contain only uppercase letters and numbers',
  })
  nationalId: string;

  @ApiProperty({
    description: 'Type of identification document',
    enum: DocumentType,
    example: DocumentType.NATIONAL_ID,
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({
    description: 'Base64 encoded image of the identification document',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
  })
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  documentImage: string;

  @ApiProperty({
    description: 'Optional flag to simulate verification result (for testing)',
    example: 'approved',
    enum: KycStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(KycStatus)
  simulateResult?: KycStatus;
}

export class KycVerificationResponseDto {
  @ApiProperty({
    description: 'Unique verification request ID',
    example: 'kyc_12345678-1234-5678-9012-123456789012',
  })
  verificationId: string;

  @ApiProperty({
    description: 'Current status of the KYC verification',
    enum: KycStatus,
    example: KycStatus.PENDING,
  })
  status: KycStatus;

  @ApiProperty({
    description: 'Reason for rejection (if applicable)',
    example: 'Document quality too low',
    required: false,
  })
  rejectionReason?: string;

  @ApiProperty({
    description: 'Estimated processing time in minutes',
    example: 30,
  })
  estimatedProcessingTime: number;

  @ApiProperty({
    description: 'Timestamp when verification was submitted',
    example: '2024-01-15T10:30:00Z',
  })
  submittedAt: string;

  @ApiProperty({
    description: 'Expected completion timestamp',
    example: '2024-01-15T11:00:00Z',
  })
  expectedCompletionAt: string;

  @ApiProperty({
    description: 'Additional metadata about the verification process',
    example: {
      provider: 'mock-kyc-provider',
      confidence: 0.95,
      checksPerformed: [
        'document_authenticity',
        'face_match',
        'data_validation',
      ],
    },
  })
  metadata: Record<string, any>;
}
