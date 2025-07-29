import type { ValueTransformer } from "typeorm"
import type { EncryptionService } from "../services/encryption.service"
import { Injectable } from "@nestjs/common"

/**
 * TypeORM ValueTransformer for encrypting and decrypting string columns.
 * This transformer should be provided by the DataEncryptionModule
 * and injected into entities.
 */
@Injectable()
export class EncryptedColumnTransformer implements ValueTransformer {
  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * Used to encrypt data before it's written to the database.
   * @param value The plaintext string to encrypt.
   * @returns The encrypted string (base64 encoded).
   */
  to(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return value
    }
    return this.encryptionService.encrypt(value)
  }

  /**
   * Used to decrypt data after it's read from the database.
   * @param value The encrypted string (base64 encoded) to decrypt.
   * @returns The decrypted plaintext string.
   */
  from(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return value
    }
    return this.encryptionService.decrypt(value)
  }
}
