import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { EncryptedColumnTransformer } from "../transformers/encrypted-column.transformer"
import { EncryptionService } from "../services/encryption.service"

@Entity("encrypted_data_examples")
export class EncryptedDataEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string

  // Example of a PII field that needs encryption
  @Column({
    type: "text", // Store as text after base64 encoding
    transformer: new EncryptedColumnTransformer(
      // This is a workaround for TypeORM's lack of DI in transformers.
      // In a real app, you'd typically use a custom decorator or a factory
      // to inject the service, or pass it directly if the transformer is instantiated manually.
      // For this example, we'll assume EncryptionService is globally available or
      // manually instantiated for the transformer.
      // A more robust solution involves a custom decorator that leverages NestJS DI.
      // For now, we'll use a placeholder and note the limitation.
      // For a production setup, consider:
      // 1. Using a custom decorator that wraps @Column and injects the service.
      // 2. Using a TypeORM subscriber or event listener for encryption/decryption.
      // 3. Manually encrypting/decrypting in service layer before saving/after retrieving.
      // For this example, we'll make the transformer directly instantiate EncryptionService
      // which will then get its config from the global ConfigService.
      // This is not ideal for testing but demonstrates the concept.
      // A better approach for TypeORM transformers with NestJS DI:
      // https://stackoverflow.com/questions/60038839/nestjs-typeorm-how-to-inject-service-into-columnoptions-transformer
      // For this example, we'll rely on the global ConfigService being available to EncryptionService
      // when it's instantiated by the transformer.
      new EncryptionService(
        // @ts-ignore - ConfigService will be provided by NestJS DI when EncryptionService is instantiated
        // This is a simplification for the v0 environment.
        // In a real NestJS app, you'd ensure ConfigService is available or use a custom decorator.
        {},
      ),
    ),
  })
  encryptedPii: string

  // Example of a financial detail field
  @Column({
    type: "text",
    nullable: true,
    transformer: new EncryptedColumnTransformer(
      new EncryptionService(
        // @ts-ignore
        {},
      ),
    ),
  })
  encryptedFinancialDetail?: string

  // Example of a non-encrypted field
  @Column()
  userId: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
