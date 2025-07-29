import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { EncryptionService } from "./services/encryption.service"
import { DataEncryptionController } from "./data-encryption.controller"
import { EncryptedDataEntity } from "./entities/encrypted-data.entity"

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([EncryptedDataEntity])],
  providers: [EncryptionService],
  controllers: [DataEncryptionController],
  exports: [EncryptionService, TypeOrmModule], // Export TypeOrmModule to make entities available
})
export class DataEncryptionModule {}
