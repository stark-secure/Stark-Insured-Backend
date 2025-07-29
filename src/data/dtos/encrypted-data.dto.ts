import { IsString, IsOptional, IsNotEmpty, IsUUID } from "class-validator"

export class CreateEncryptedDataDto {
  @IsString()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  piiData: string // Plaintext PII to be encrypted

  @IsOptional()
  @IsString()
  financialDetail?: string // Plaintext financial data to be encrypted
}

export class GetEncryptedDataDto {
  @IsUUID()
  id: string
}

export class EncryptedDataResponseDto {
  @IsUUID()
  id: string

  @IsString()
  userId: string

  @IsString()
  piiData: string // Decrypted PII

  @IsOptional()
  @IsString()
  financialDetail?: string // Decrypted financial data

  @IsString()
  createdAt: string

  @IsString()
  updatedAt: string
}

export class EncryptDecryptDto {
  @IsString()
  @IsNotEmpty()
  text: string
}

export class EncryptDecryptResponseDto {
  @IsString()
  originalText: string

  @IsString()
  encryptedText: string

  @IsString()
  decryptedText: string
}
