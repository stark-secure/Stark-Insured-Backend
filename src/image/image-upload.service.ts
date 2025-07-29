import { Injectable, Logger } from "@nestjs/common"
import { v4 as uuidv4 } from "uuid"
import type { ImageValidationService } from "./services/image-validation.service"
import type { ImageCompressionService } from "./services/image-compression.service"
import type { StorageService } from "./services/storage.service"
import type { CDNService } from "./services/cdn.service"
import type { UploadResult, ProcessedImage, ImageVariant } from "./interfaces/image-upload.interface"
import { ImageUploadFailedException } from "./exceptions/image-upload.exception"

@Injectable()
export class ImageUploadService {
  private readonly logger = new Logger(ImageUploadService.name)

  constructor(
    private imageValidationService: ImageValidationService,
    private imageCompressionService: ImageCompressionService,
    private storageService: StorageService,
    private cdnService: CDNService,
  ) {}

  /**
   * Processes and uploads a single image
   * @param file Uploaded file buffer
   * @param originalName Original filename
   * @param options Upload options
   * @returns Promise<UploadResult>
   */
  async uploadImage(
    file: Buffer,
    originalName: string,
    options: {
      quality?: number
      createVariants?: boolean
      uploadToCDN?: boolean
    } = {},
  ): Promise<UploadResult> {
    const uploadId = uuidv4()
    const startTime = Date.now()

    try {
      this.logger.log(`Starting image upload process: ${originalName} (ID: ${uploadId})`)

      // Step 1: Validate the image
      const metadata = await this.imageValidationService.validateImage(file, originalName)

      // Step 2: Compress the image
      const quality = options.quality || this.imageCompressionService.getOptimalCompressionSettings(metadata)
      const processedImage = await this.imageCompressionService.compressImage(file, metadata, quality)

      // Step 3: Upload to local storage
      const localPath = await this.storageService.upload(
        processedImage.buffer,
        processedImage.metadata.filename,
        processedImage.metadata,
      )

      // Step 4: Upload to CDN if enabled
      let cdnResult = null
      if (options.uploadToCDN !== false && this.cdnService.isConfigured()) {
        cdnResult = await this.cdnService.uploadToCDN(processedImage.buffer, processedImage.metadata)
      }

      // Step 5: Create variants if requested
      if (options.createVariants) {
        await this.createImageVariants(file, metadata, uploadId)
      }

      const processingTime = Date.now() - startTime
      this.logger.log(
        `Image upload completed: ${originalName} in ${processingTime}ms (ID: ${uploadId}, Compression: ${Math.round(processedImage.compressionRatio)}%)`,
      )

      const result: UploadResult = {
        success: true,
        message: "Image uploaded successfully",
        data: {
          id: uploadId,
          originalName: metadata.originalName,
          filename: processedImage.metadata.filename,
          url: this.storageService.getUrl(processedImage.metadata.filename),
          cdnUrl: cdnResult?.success ? cdnResult.cdnUrl : undefined,
          size: metadata.size,
          compressedSize: processedImage.compressedSize,
          compressionRatio: processedImage.compressionRatio,
          metadata: processedImage.metadata,
          uploadedAt: new Date(),
        },
      }

      return result
    } catch (error) {
      this.logger.error(`Image upload failed: ${originalName} (ID: ${uploadId}) - ${error.message}`)

      return {
        success: false,
        message: "Image upload failed",
        error: {
          code: error.errorCode || "UPLOAD_FAILED",
          message: error.message,
          details: {
            uploadId,
            originalName,
            processingTime: Date.now() - startTime,
          },
        },
      }
    }
  }

  /**
   * Processes and uploads multiple images
   * @param files Array of file buffers with names
   * @param options Upload options
   * @returns Promise<UploadResult[]>
   */
  async uploadMultipleImages(
    files: Array<{ buffer: Buffer; originalName: string }>,
    options: {
      quality?: number
      createVariants?: boolean
      uploadToCDN?: boolean
      maxConcurrent?: number
    } = {},
  ): Promise<UploadResult[]> {
    const maxConcurrent = options.maxConcurrent || 3
    const results: UploadResult[] = []

    this.logger.log(`Starting batch upload of ${files.length} images (max concurrent: ${maxConcurrent})`)

    // Process files in batches to avoid overwhelming the system
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent)
      const batchPromises = batch.map((file) => this.uploadImage(file.buffer, file.originalName, options))

      const batchResults = await Promise.allSettled(batchPromises)
      batchResults.forEach((result) => {
        if (result.status === "fulfilled") {
          results.push(result.value)
        } else {
          results.push({
            success: false,
            message: "Upload failed",
            error: {
              code: "BATCH_UPLOAD_FAILED",
              message: result.reason?.message || "Unknown error",
            },
          })
        }
      })

      this.logger.log(`Completed batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(files.length / maxConcurrent)}`)
    }

    const successCount = results.filter((r) => r.success).length
    this.logger.log(`Batch upload completed: ${successCount}/${files.length} successful`)

    return results
  }

  /**
   * Creates image variants (thumbnails, different sizes)
   * @param originalBuffer Original image buffer
   * @param metadata Image metadata
   * @param uploadId Upload ID for tracking
   * @returns Promise<ProcessedImage[]>
   */
  private async createImageVariants(
    originalBuffer: Buffer,
    metadata: any,
    uploadId: string,
  ): Promise<ProcessedImage[]> {
    const variants: ImageVariant[] = [
      { name: "thumbnail", width: 150, height: 150, quality: 80 },
      { name: "small", width: 400, height: 400, quality: 85 },
      { name: "medium", width: 800, height: 800, quality: 80 },
    ]

    try {
      this.logger.log(`Creating ${variants.length} variants for upload ID: ${uploadId}`)

      const processedVariants = await this.imageCompressionService.createVariants(originalBuffer, metadata, variants)

      // Upload each variant
      const uploadPromises = processedVariants.map(async (variant) => {
        await this.storageService.upload(variant.buffer, variant.metadata.filename, variant.metadata)

        // Upload to CDN if configured
        if (this.cdnService.isConfigured()) {
          await this.cdnService.uploadToCDN(variant.buffer, variant.metadata)
        }

        return variant
      })

      const uploadedVariants = await Promise.all(uploadPromises)
      this.logger.log(`Successfully created ${uploadedVariants.length} variants for upload ID: ${uploadId}`)

      return uploadedVariants
    } catch (error) {
      this.logger.error(`Failed to create variants for upload ID ${uploadId}: ${error.message}`)
      throw new ImageUploadFailedException(`Variant creation failed: ${error.message}`)
    }
  }

  /**
   * Deletes an uploaded image and its variants
   * @param filename Image filename
   * @param publicId CDN public ID (optional)
   * @returns Promise<boolean>
   */
  async deleteImage(filename: string, publicId?: string): Promise<boolean> {
    try {
      this.logger.log(`Deleting image: ${filename}`)

      // Delete from local storage
      const localDeleted = await this.storageService.delete(filename)

      // Delete from CDN if public ID is provided
      let cdnDeleted = true
      if (publicId && this.cdnService.isConfigured()) {
        cdnDeleted = await this.cdnService.deleteFromCDN(publicId)
      }

      // Delete variants (assuming they follow naming convention)
      const variantNames = ["thumbnail", "small", "medium"]
      const baseName = filename.split(".")[0]
      const extension = filename.split(".").pop()

      for (const variantName of variantNames) {
        const variantFilename = `${baseName}_${variantName}.${extension}`
        await this.storageService.delete(variantFilename)
      }

      const success = localDeleted && cdnDeleted
      this.logger.log(`Image deletion ${success ? "successful" : "partially failed"}: ${filename}`)

      return success
    } catch (error) {
      this.logger.error(`Failed to delete image ${filename}: ${error.message}`)
      return false
    }
  }

  /**
   * Gets upload configuration and limits
   * @returns Upload configuration
   */
  getUploadConfig() {
    return {
      ...this.imageValidationService.getConfig(),
      cdnEnabled: this.cdnService.isConfigured(),
    }
  }

  /**
   * Gets storage statistics
   * @returns Storage usage information
   */
  async getStorageStats() {
    return await this.storageService.getStorageStats()
  }
}
