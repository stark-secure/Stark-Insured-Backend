import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import sharp from "sharp"
import {
  InvalidImageFormatException,
  FileSizeExceededException,
  InvalidImageDimensionsException,
} from "../exceptions/image-upload.exception"
import type { ImageUploadConfig, ImageMetadata } from "../interfaces/image-upload.interface"

@Injectable()
export class ImageValidationService {
  private readonly logger = new Logger(ImageValidationService.name)
  private readonly config: ImageUploadConfig

  constructor(private configService: ConfigService) {
    this.config = {
      maxFileSize: this.configService.get<number>("IMAGE_MAX_FILE_SIZE", 2 * 1024 * 1024), // 2MB
      allowedFormats: this.configService.get<string>("IMAGE_ALLOWED_FORMATS", "jpg,jpeg,png,webp").split(","),
      compressionQuality: this.configService.get<number>("IMAGE_COMPRESSION_QUALITY", 80),
      maxWidth: this.configService.get<number>("IMAGE_MAX_WIDTH", 2048),
      maxHeight: this.configService.get<number>("IMAGE_MAX_HEIGHT", 2048),
      enableWebP: this.configService.get<boolean>("IMAGE_ENABLE_WEBP", true),
      enableCDN: this.configService.get<boolean>("IMAGE_ENABLE_CDN", false),
    }
  }

  /**
   * Validates an uploaded image file
   * @param file The uploaded file buffer
   * @param originalName Original filename
   * @returns Promise<ImageMetadata> if valid
   * @throws Various validation exceptions if invalid
   */
  async validateImage(file: Buffer, originalName: string): Promise<ImageMetadata> {
    try {
      // Get image metadata using Sharp
      const image = sharp(file)
      const metadata = await image.metadata()

      if (!metadata.width || !metadata.height || !metadata.format) {
        throw new Error("Unable to read image metadata")
      }

      // Extract file extension from original name
      const extension = originalName.split(".").pop()?.toLowerCase() || ""
      const detectedFormat = metadata.format.toLowerCase()

      // Validate file format
      this.validateFormat(extension, detectedFormat)

      // Validate file size
      this.validateFileSize(file.length)

      // Validate dimensions
      this.validateDimensions(metadata.width, metadata.height)

      const imageMetadata: ImageMetadata = {
        originalName,
        filename: this.generateFilename(originalName, detectedFormat),
        mimetype: `image/${detectedFormat}`,
        size: file.length,
        width: metadata.width,
        height: metadata.height,
        format: detectedFormat,
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || "srgb",
      }

      this.logger.log(
        `Image validated: ${originalName} (${metadata.width}x${metadata.height}, ${Math.round(file.length / 1024)}KB)`,
      )

      return imageMetadata
    } catch (error) {
      this.logger.error(`Image validation failed for ${originalName}: ${error.message}`)
      throw error
    }
  }

  /**
   * Validates image format against allowed formats
   */
  private validateFormat(extension: string, detectedFormat: string): void {
    const normalizedExtension = extension === "jpg" ? "jpeg" : extension
    const normalizedDetected = detectedFormat === "jpg" ? "jpeg" : detectedFormat

    if (
      !this.config.allowedFormats.includes(normalizedExtension) &&
      !this.config.allowedFormats.includes(normalizedDetected)
    ) {
      throw new InvalidImageFormatException(extension, this.config.allowedFormats)
    }

    // Ensure the file extension matches the detected format (prevent spoofing)
    if (normalizedExtension !== normalizedDetected) {
      this.logger.warn(`Format mismatch: extension '${extension}' vs detected '${detectedFormat}'`)
      // Allow it but log the discrepancy - use detected format
    }
  }

  /**
   * Validates file size against maximum allowed size
   */
  private validateFileSize(size: number): void {
    if (size > this.config.maxFileSize) {
      throw new FileSizeExceededException(size, this.config.maxFileSize)
    }
  }

  /**
   * Validates image dimensions against maximum allowed dimensions
   */
  private validateDimensions(width: number, height: number): void {
    if (width > this.config.maxWidth || height > this.config.maxHeight) {
      throw new InvalidImageDimensionsException(width, height, this.config.maxWidth, this.config.maxHeight)
    }
  }

  /**
   * Generates a unique filename for the image
   */
  private generateFilename(originalName: string, format: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const baseName = originalName.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_")
    return `${baseName}_${timestamp}_${random}.${format}`
  }

  /**
   * Gets the current upload configuration
   */
  getConfig(): ImageUploadConfig {
    return { ...this.config }
  }
}
