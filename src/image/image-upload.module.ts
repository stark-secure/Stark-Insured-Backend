import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { MulterModule } from "@nestjs/platform-express"
import { ImageUploadService } from "./image-upload.service"
import { ImageUploadController } from "./image-upload.controller"
import { ImageCompressionService } from "./services/image-compression.service"
import { ImageValidationService } from "./services/image-validation.service"
import { CDNService } from "./services/cdn.service"
import { StorageService } from "./services/storage.service"
import { memoryStorage } from "multer"

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(), // Store files in memory for processing
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB initial limit (will be validated separately)
        files: 5, // Maximum 5 files per request
      },
    }),
  ],
  providers: [ImageUploadService, ImageCompressionService, ImageValidationService, CDNService, StorageService],
  controllers: [ImageUploadController],
  exports: [ImageUploadService],
})
export class ImageUploadModule {}
