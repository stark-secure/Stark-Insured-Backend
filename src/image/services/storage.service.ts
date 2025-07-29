import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import { promises as fs } from "fs"
import { join } from "path"
import { ImageUploadFailedException } from "../exceptions/image-upload.exception"
import type { StorageProvider, ImageMetadata } from "../interfaces/image-upload.interface"

@Injectable()
export class StorageService implements StorageProvider {
  private readonly logger = new Logger(StorageService.name)
  private readonly uploadPath: string
  private readonly baseUrl: string

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get<string>("IMAGE_UPLOAD_PATH", "./uploads/images")
    this.baseUrl = this.configService.get<string>("IMAGE_BASE_URL", "http://localhost:3000/images")
    this.ensureUploadDirectory()
  }

  /**
   * Uploads an image buffer to local storage
   * @param buffer Image buffer
   * @param filename Target filename
   * @param metadata Image metadata
   * @returns Promise<string> - File path
   */
  async upload(buffer: Buffer, filename: string, metadata: ImageMetadata): Promise<string> {
    try {
      const filePath = join(this.uploadPath, filename)
      await fs.writeFile(filePath, buffer)

      this.logger.log(`Image uploaded to local storage: ${filename} (${Math.round(buffer.length / 1024)}KB)`)
      return filePath
    } catch (error) {
      this.logger.error(`Failed to upload image to local storage: ${error.message}`)
      throw new ImageUploadFailedException(`Local storage upload failed: ${error.message}`)
    }
  }

  /**
   * Deletes an image from local storage
   * @param filename Filename to delete
   * @returns Promise<boolean>
   */
  async delete(filename: string): Promise<boolean> {
    try {
      const filePath = join(this.uploadPath, filename)
      await fs.unlink(filePath)
      this.logger.log(`Image deleted from local storage: ${filename}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to delete image from local storage: ${error.message}`)
      return false
    }
  }

  /**
   * Gets the public URL for an image
   * @param filename Image filename
   * @returns Public URL
   */
  getUrl(filename: string): string {
    return `${this.baseUrl}/${filename}`
  }

  /**
   * Ensures the upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath)
    } catch {
      try {
        await fs.mkdir(this.uploadPath, { recursive: true })
        this.logger.log(`Created upload directory: ${this.uploadPath}`)
      } catch (error) {
        this.logger.error(`Failed to create upload directory: ${error.message}`)
        throw new ImageUploadFailedException(`Failed to create upload directory: ${error.message}`)
      }
    }
  }

  /**
   * Gets storage statistics
   * @returns Storage usage information
   */
  async getStorageStats(): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const files = await fs.readdir(this.uploadPath)
      let totalSize = 0

      for (const file of files) {
        const filePath = join(this.uploadPath, file)
        const stats = await fs.stat(filePath)
        totalSize += stats.size
      }

      return {
        totalFiles: files.length,
        totalSize,
      }
    } catch (error) {
      this.logger.error(`Failed to get storage stats: ${error.message}`)
      return { totalFiles: 0, totalSize: 0 }
    }
  }
}
