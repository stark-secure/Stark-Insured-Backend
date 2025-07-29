import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  Query,
  Param,
  Logger,
  HttpStatus,
  HttpCode,
} from "@nestjs/common"
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express"
import type { Express } from "express"
import type { ImageUploadService } from "./image-upload.service"
import type { UploadOptionsDto, BatchUploadOptionsDto } from "./dtos/image-upload.dto"
import type { UploadResult } from "./interfaces/image-upload.interface"

@Controller("images")
export class ImageUploadController {
  private readonly logger = new Logger(ImageUploadController.name)

  constructor(private readonly imageUploadService: ImageUploadService) {}

  /**
   * Upload a single image
   */
  @Post("upload")
  @UseInterceptors(FileInterceptor("image"))
  @HttpCode(HttpStatus.CREATED)
  async uploadImage(file: Express.Multer.File, @Query() options: UploadOptionsDto): Promise<UploadResult> {
    if (!file) {
      return {
        success: false,
        message: "No file provided",
        error: {
          code: "NO_FILE",
          message: "Please provide an image file",
        },
      }
    }

    this.logger.log(`Received upload request: ${file.originalname} (${Math.round(file.size / 1024)}KB)`)

    return await this.imageUploadService.uploadImage(file.buffer, file.originalname, {
      quality: options.quality,
      createVariants: options.createVariants,
      uploadToCDN: options.uploadToCDN,
    })
  }

  /**
   * Upload multiple images
   */
  @Post("upload/batch")
  @UseInterceptors(FilesInterceptor("images", 10)) // Max 10 files
  @HttpCode(HttpStatus.CREATED)
  async uploadMultipleImages(
    files: Express.Multer.File[],
    @Query() options: BatchUploadOptionsDto,
  ): Promise<{ results: UploadResult[]; summary: { total: number; successful: number; failed: number } }> {
    if (!files || files.length === 0) {
      return {
        results: [
          {
            success: false,
            message: "No files provided",
            error: {
              code: "NO_FILES",
              message: "Please provide at least one image file",
            },
          },
        ],
        summary: { total: 0, successful: 0, failed: 1 },
      }
    }

    this.logger.log(`Received batch upload request: ${files.length} files`)

    const fileData = files.map((file) => ({
      buffer: file.buffer,
      originalName: file.originalname,
    }))

    const results = await this.imageUploadService.uploadMultipleImages(fileData, {
      quality: options.quality,
      createVariants: options.createVariants,
      uploadToCDN: options.uploadToCDN,
      maxConcurrent: options.maxConcurrent,
    })

    const successful = results.filter((r) => r.success).length
    const failed = results.length - successful

    return {
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
    }
  }

  /**
   * Delete an image
   */
  @Delete(":filename")
  @HttpCode(HttpStatus.OK)
  async deleteImage(
    @Param("filename") filename: string,
    @Query("publicId") publicId?: string,
  ): Promise<{
    success: boolean
    message: string
  }> {
    this.logger.log(`Received delete request: ${filename}`)

    const success = await this.imageUploadService.deleteImage(filename, publicId)

    return {
      success,
      message: success ? "Image deleted successfully" : "Failed to delete image",
    }
  }

  /**
   * Get upload configuration
   */
  @Get("config")
  getUploadConfig() {
    return this.imageUploadService.getUploadConfig()
  }

  /**
   * Get storage statistics
   */
  @Get("stats")
  async getStorageStats() {
    return await this.imageUploadService.getStorageStats()
  }

  /**
   * Health check endpoint
   */
  @Get("health")
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    }
  }
}
