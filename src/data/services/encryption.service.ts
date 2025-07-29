import { Injectable, Logger, type OnModuleInit } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import * as crypto from "crypto"

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name)
  private algorithm: string
  private key: Buffer
  private ivLength: number

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.algorithm = this.configService.get<string>("ENCRYPTION_ALGORITHM", "aes-256-cbc")
    const encryptionKey = this.configService.get<string>("ENCRYPTION_KEY")

    if (!encryptionKey) {
      this.logger.error("ENCRYPTION_KEY is not set. Data encryption will not function correctly.")
      throw new Error("ENCRYPTION_KEY environment variable is required for encryption service.")
    }

    // Ensure the key is of the correct length for the algorithm
    const keyLength = 32 // For aes-256-cbc, key length is 32 bytes (256 bits)
    if (encryptionKey.length !== keyLength) {
      this.logger.warn(
        `ENCRYPTION_KEY length is ${encryptionKey.length}, expected ${keyLength} for ${this.algorithm}. Padding/truncating.`,
      )
      this.key = Buffer.from(encryptionKey.padEnd(keyLength, "\0").substring(0, keyLength))
    } else {
      this.key = Buffer.from(encryptionKey)
    }

    this.ivLength = 16 // For aes-256-cbc, IV length is 16 bytes
    this.logger.log(`EncryptionService initialized with algorithm: ${this.algorithm}`)
  }

  /**
   * Encrypts a plaintext string using AES-256-CBC.
   * The IV is prepended to the ciphertext for decryption.
   * @param plaintext The string to encrypt.
   * @returns The encrypted string (base64 encoded IV + ciphertext).
   */
  encrypt(plaintext: string): string {
    if (!this.key) {
      throw new Error("Encryption key not initialized. Cannot encrypt.")
    }
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    let encrypted = cipher.update(plaintext, "utf8", "hex")
    encrypted += cipher.final("hex")
    // Prepend IV to ciphertext, then base64 encode the whole thing
    return Buffer.from(iv.toString("hex") + encrypted).toString("base64")
  }

  /**
   * Decrypts an encrypted string using AES-256-CBC.
   * Assumes the IV is prepended to the ciphertext.
   * @param encryptedText The encrypted string (base64 encoded IV + ciphertext).
   * @returns The decrypted plaintext string.
   */
  decrypt(encryptedText: string): string {
    if (!this.key) {
      throw new Error("Encryption key not initialized. Cannot decrypt.")
    }
    const combined = Buffer.from(encryptedText, "base64").toString("hex")
    const iv = Buffer.from(combined.substring(0, this.ivLength * 2), "hex")
    const ciphertext = combined.substring(this.ivLength * 2)

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    let decrypted = decipher.update(ciphertext, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  }
}
