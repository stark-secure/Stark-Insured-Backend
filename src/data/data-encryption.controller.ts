import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Logger } from "@nestjs/common"
import type { EncryptionService } from "./services/encryption.service"
import type {
  CreateEncryptedDataDto,
  GetEncryptedDataDto,
  EncryptedDataResponseDto,
  EncryptDecryptDto,
  EncryptDecryptResponseDto,
} from "./dtos/encrypted-data.dto"
import type { Repository } from "typeorm"
import type { EncryptedDataEntity } from "./entities/encrypted-data.entity"

@Controller("encryption")
export class DataEncryptionController {
  private readonly logger = new Logger(DataEncryptionController.name)

  constructor(
    private readonly encryptionService: EncryptionService,
    private encryptedDataRepository: Repository<EncryptedDataEntity>,
  ) {}

  /**
   * Endpoint to test encryption and decryption of a given string.
   */
  @Post("test")
  @HttpCode(HttpStatus.OK)
  testEncryption(@Body() body: EncryptDecryptDto): EncryptDecryptResponseDto {
    this.logger.log(`Testing encryption for: ${body.text.substring(0, 20)}...`)
    const encrypted = this.encryptionService.encrypt(body.text)
    const decrypted = this.encryptionService.decrypt(encrypted)
    return {
      originalText: body.text,
      encryptedText: encrypted,
      decryptedText: decrypted,
    }
  }

  /**
   * Saves an example entity with encrypted data to the database.
   */
  @Post("data")
  @HttpCode(HttpStatus.CREATED)
  async createEncryptedData(@Body() createDto: CreateEncryptedDataDto): Promise<EncryptedDataResponseDto> {
    this.logger.log(`Creating encrypted data for userId: ${createDto.userId}`)
    const entity = this.encryptedDataRepository.create({
      userId: createDto.userId,
      encryptedPii: createDto.piiData, // This will be encrypted by the transformer
      encryptedFinancialDetail: createDto.financialDetail, // This will be encrypted by the transformer
    })
    const savedEntity = await this.encryptedDataRepository.save(entity)

    // When retrieved, the data is automatically decrypted by the transformer
    return {
      id: savedEntity.id,
      userId: savedEntity.userId,
      piiData: savedEntity.encryptedPii, // Already decrypted
      financialDetail: savedEntity.encryptedFinancialDetail, // Already decrypted
      createdAt: savedEntity.createdAt.toISOString(),
      updatedAt: savedEntity.updatedAt.toISOString(),
    }
  }

  /**
   * Retrieves an example entity with encrypted data from the database.
   * The data will be automatically decrypted upon retrieval.
   */
  @Get("data/:id")
  @HttpCode(HttpStatus.OK)
  async getEncryptedData(@Param() params: GetEncryptedDataDto): Promise<EncryptedDataResponseDto> {
    this.logger.log(`Retrieving encrypted data for ID: ${params.id}`)
    const entity = await this.encryptedDataRepository.findOne({ where: { id: params.id } })

    if (!entity) {
      this.logger.warn(`Encrypted data with ID ${params.id} not found.`)
      throw new HttpCode(HttpStatus.NOT_FOUND)
    }

    // Data is automatically decrypted by the transformer when accessed
    return {
      id: entity.id,
      userId: entity.userId,
      piiData: entity.encryptedPii, // Already decrypted
      financialDetail: entity.encryptedFinancialDetail, // Already decrypted
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }
  }
}
