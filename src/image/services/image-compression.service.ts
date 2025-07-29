import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import sharp from "sharp"
import { ImageCompressionException } from "../exceptions/image-upload.exception"
import type { ProcessedImage, ImageMetadata, ImageVariant } from "../interfaces/image-upload.interface"
import { CompressionLevel } from "../enums/image-upload.enum"

@Injectable()
export class ImageCompressionService {
  private readonly logger = new Logger(ImageCompressionService.name)
  private readonly defaultQuality: number
  private readonly enableWebP: boolean

  constructor(private configService: ConfigService) {
    this.defaultQuality = this.configService.get<number>("IMAGE_COMPRESSION_QUALITY", 80)
    this.enableWebP = this.configService.get<boolean>("IMAGE_ENABLE_WEBP", true)
  }

  /**
   * Compresses an image while maintaining quality
   * @param buffer Original image buffer
   * @param metadata Image metadata
   * @param quality Compression quality (0-100)
   * @returns Promise<ProcessedImage>
   */
  async compressImage(buffer: Buffer, metadata: ImageMetadata, quality?: number): Promise<ProcessedImage> {
    try {
      const compressionQuality = quality || this.defaultQuality
      const originalSize = buffer.length

      this.logger.log(
        `Compressing image: ${metadata.originalName} (${metadata.width}x${metadata.height}, ${Math.round(originalSize / 1024)}KB)`,
      )

      let processedBuffer: Buffer
      let outputFormat = metadata.format

      // Create Sharp instance
      const image = sharp(buffer)

      // Apply compression based on format
      if (metadata.format === "jpeg" || metadata.format === "jpg") {
        processedBuffer = await image
          .jpeg({
            quality: compressionQuality,
            progressive: true,
            mozjpeg: true, // Use mozjpeg encoder for better compression
          })
          .toBuffer()
      } else if (metadata.format === "png") {
        processedBuffer = await image
          .png({
            quality: compressionQuality,
            compressionLevel: 9,
            progressive: true,
          })
          .toBuffer()
      } else if (metadata.format === "webp") {
        processedBuffer = await image
          .webp({
            quality: compressionQuality,
            effort: 6, // Higher effort for better compression
          })
          .toBuffer()
      } else {
        // For other formats, convert to JPEG
        processedBuffer = await image
          .jpeg({
            quality: compressionQuality,
            progressive: true,
            mozjpeg: true,
          })
          .toBuffer()
        outputFormat = "jpeg"
      }

      const compressedSize = processedBuffer.length
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

      // Update metadata with new information
      const updatedMetadata: ImageMetadata = {
        ...metadata,
        size: compressedSize,
        format: outputFormat,
        filename: metadata.filename.replace(/\.[^.]+$/, `.${outputFormat}`),
        mimetype: `image/${outputFormat}`,
      }

      const result: ProcessedImage = {
        buffer: processedBuffer,
        metadata: updatedMetadata,
        compressionRatio,
        originalSize,
        compressedSize,
      }

      this.logger.log(
        `Image compressed: ${metadata.originalName} - ${Math.round(compressionRatio)}% reduction (${Math.round(originalSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB)`,
      )

      return result
    } catch (error) {
      this.logger.error(`Image compression failed for ${metadata.originalName}: ${error.message}`)
      throw new ImageCompressionException(error.message)
    }
  }

  /**
   * Creates multiple variants of an image (thumbnails, different sizes)
   * @param buffer Original image buffer
   * @param metadata Image metadata
   * @param variants Array of variant specifications
   * @returns Promise<ProcessedImage[]>
   */
  async createVariants(buffer: Buffer, metadata: ImageMetadata, variants: ImageVariant[]): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = []

    for (const variant of variants) {
      try {
        this.logger.log(`Creating variant: ${variant.name} (${variant.width}x${variant.height})`)

        const image = sharp(buffer)
        const resized = image.resize(variant.width, variant.height, {
          fit: "inside",
          withoutEnlargement: true,
        })

        let processedBuffer: Buffer
        const outputFormat = variant.format || metadata.format

        // Apply format-specific compression
        if (outputFormat === "jpeg" || outputFormat === "jpg") {
          processedBuffer = await resized
            .jpeg({
              quality: variant.quality,
              progressive: true,
              mozjpeg: true,
            })
            .toBuffer()
        } else if (outputFormat === "png") {
          processedBuffer = await resized
            .png({
              quality: variant.quality,
              compressionLevel: 9,
            })
            .toBuffer()
        } else if (outputFormat === "webp") {
          processedBuffer = await resized
            .webp({
              quality: variant.quality,
              effort: 6,
            })
            .toBuffer()
        } else {
          processedBuffer = await resized
            .jpeg({
              quality: variant.quality,
              progressive: true,
            })
            .toBuffer()
        }

        // Get actual dimensions after resize
        const resizedMetadata = await sharp(processedBuffer).metadata()

        const variantMetadata: ImageMetadata = {
          ...metadata,
          filename: `${metadata.filename.split(".")[0]}_${variant.name}.${outputFormat}`,
          size: processedBuffer.length,
          width: resizedMetadata.width || variant.width,
          height: resizedMetadata.height || variant.height,
          format: outputFormat,
          mimetype: `image/${outputFormat}`,
        }

        const compressionRatio = ((buffer.length - processedBuffer.length) / buffer.length) * 100

        results.push({
          buffer: processedBuffer,
          metadata: variantMetadata,
          compressionRatio,
          originalSize: buffer.length,
          compressedSize: processedBuffer.length,
        })

        this.logger.log(
          `Variant created: ${variant.name} - ${Math.round(processedBuffer.length / 1024)}KB (${resizedMetadata.width}x${resizedMetadata.height})`,
        )
      } catch (error) {
        this.logger.error(`Failed to create variant ${variant.name}: ${error.message}`)
        // Continue with other variants
      }
    }

    return results
  }

  /**
   * Converts image to WebP format for better compression
   * @param buffer Original image buffer
   * @param metadata Image metadata
   * @param quality WebP quality (0-100)
   * @returns Promise<ProcessedImage>
   */
  async convertToWebP(buffer: Buffer, metadata: ImageMetadata, quality?: number): Promise<ProcessedImage> {
    if (!this.enableWebP) {
      throw new ImageCompressionException("WebP conversion is disabled")
    }

    try {
      const webpQuality = quality || this.defaultQuality
      const originalSize = buffer.length

      this.logger.log(`Converting to WebP: ${metadata.originalName}`)

      const webpBuffer = await sharp(buffer)
        .webp({
          quality: webpQuality,
          effort: 6,
          lossless: false,
        })
        .toBuffer()

      const compressedSize = webpBuffer.length
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

      const webpMetadata: ImageMetadata = {
        ...metadata,
        format: "webp",
        mimetype: "image/webp",
        filename: metadata.filename.replace(/\.[^.]+$/, ".webp"),
        size: compressedSize,
      }

      this.logger.log(
        `WebP conversion completed: ${Math.round(compressionRatio)}% reduction (${Math.round(originalSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB)`,
      )

      return {
        buffer: webpBuffer,
        metadata: webpMetadata,
        compressionRatio,
        originalSize,
        compressedSize,
      }
    } catch (error) {
      this.logger.error(`WebP conversion failed for ${metadata.originalName}: ${error.message}`)
      throw new ImageCompressionException(`WebP conversion failed: ${error.message}`)
    }
  }

  /**
   * Gets optimal compression settings based on image characteristics
   * @param metadata Image metadata
   * @returns Recommended compression quality
   */
  getOptimalCompressionSettings(metadata: ImageMetadata): number {
    const { width, height, format, hasAlpha } = metadata
    const pixelCount = width * height

    // Adjust quality based on image size and format
    if (pixelCount > 2000000) {
      // Large images (>2MP) - more aggressive compression
      return format === "png" && hasAlpha ? CompressionLevel.MEDIUM : CompressionLevel.HIGH
    } else if (pixelCount > 500000) {
      // Medium images (0.5-2MP) - moderate compression
      return CompressionLevel.MEDIUM
    } else {
      // Small images (<0.5MP) - light compression
      return CompressionLevel.LOW
    }
  }
}
