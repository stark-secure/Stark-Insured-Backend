import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import axios, { type AxiosInstance } from "axios"
import FormData from "form-data"
import type { CDNUploadResult, ImageMetadata } from "../interfaces/image-upload.interface"

@Injectable()
export class CDNService {
  private readonly logger = new Logger(CDNService.name)
  private readonly client: AxiosInstance
  private readonly isEnabled: boolean
  private readonly cdnProvider: string
  private readonly apiKey: string
  private readonly cloudName: string
  private readonly uploadPreset: string

  constructor(private configService: ConfigService) {
    this.isEnabled = this.configService.get<boolean>("CDN_ENABLED", false)
    this.cdnProvider = this.configService.get<string>("CDN_PROVIDER", "cloudinary")
    this.apiKey = this.configService.get<string>("CDN_API_KEY", "")
    this.cloudName = this.configService.get<string>("CDN_CLOUD_NAME", "")
    this.uploadPreset = this.configService.get<string>("CDN_UPLOAD_PRESET", "")

    if (this.isEnabled) {
      this.client = axios.create({
        timeout: 30000,
        headers: {
          "User-Agent": "NestJS-ImageUpload/1.0",
        },
      })
      this.logger.log(`CDN service initialized with provider: ${this.cdnProvider}`)
    } else {
      this.logger.log("CDN service disabled")
    }
  }

  /**
   * Uploads an image to CDN (Cloudinary example)
   * @param buffer Image buffer
   * @param metadata Image metadata
   * @returns Promise<CDNUploadResult>
   */
  async uploadToCDN(buffer: Buffer, metadata: ImageMetadata): Promise<CDNUploadResult> {
    if (!this.isEnabled) {
      return {
        success: false,
        url: "",
        cdnUrl: "",
        error: "CDN is disabled",
      }
    }

    try {
      this.logger.log(`Uploading to CDN: ${metadata.filename}`)

      if (this.cdnProvider === "cloudinary") {
        return await this.uploadToCloudinary(buffer, metadata)
      } else {
        // Add other CDN providers here
        return {
          success: false,
          url: "",
          cdnUrl: "",
          error: `Unsupported CDN provider: ${this.cdnProvider}`,
        }
      }
    } catch (error) {
      this.logger.error(`CDN upload failed: ${error.message}`)
      return {
        success: false,
        url: "",
        cdnUrl: "",
        error: error.message,
      }
    }
  }

  /**
   * Uploads to Cloudinary CDN
   * @param buffer Image buffer
   * @param metadata Image metadata
   * @returns Promise<CDNUploadResult>
   */
  private async uploadToCloudinary(buffer: Buffer, metadata: ImageMetadata): Promise<CDNUploadResult> {
    const formData = new FormData()
    formData.append("file", buffer, {
      filename: metadata.filename,
      contentType: metadata.mimetype,
    })
    formData.append("upload_preset", this.uploadPreset)
    formData.append("public_id", metadata.filename.split(".")[0])
    formData.append("resource_type", "image")
    formData.append("quality", "auto:good")
    formData.append("fetch_format", "auto")

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`

    try {
      const response = await this.client.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
        },
      })

      const { secure_url, public_id, url } = response.data

      this.logger.log(`Successfully uploaded to Cloudinary: ${public_id}`)

      return {
        success: true,
        url: url,
        cdnUrl: secure_url,
        publicId: public_id,
      }
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${error.response?.data?.error?.message || error.message}`)
      throw new Error(`Cloudinary upload failed: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  /**
   * Deletes an image from CDN
   * @param publicId Public ID of the image to delete
   * @returns Promise<boolean>
   */
  async deleteFromCDN(publicId: string): Promise<boolean> {
    if (!this.isEnabled) {
      return false
    }

    try {
      if (this.cdnProvider === "cloudinary") {
        const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`
        const formData = new FormData()
        formData.append("public_id", publicId)

        await this.client.post(deleteUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
          },
        })

        this.logger.log(`Successfully deleted from CDN: ${publicId}`)
        return true
      }
    } catch (error) {
      this.logger.error(`CDN deletion failed: ${error.message}`)
    }

    return false
  }

  /**
   * Generates optimized CDN URLs with transformations
   * @param publicId Public ID of the image
   * @param transformations Transformation parameters
   * @returns Optimized CDN URL
   */
  generateOptimizedUrl(publicId: string, transformations: Record<string, any> = {}): string {
    if (!this.isEnabled || this.cdnProvider !== "cloudinary") {
      return ""
    }

    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`
    const defaultTransformations = {
      q_auto: true, // Auto quality
      f_auto: true, // Auto format
      ...transformations,
    }

    const transformString = Object.entries(defaultTransformations)
      .map(([key, value]) => (value === true ? key : `${key}_${value}`))
      .join(",")

    return `${baseUrl}/${transformString}/${publicId}`
  }

  /**
   * Checks if CDN is enabled and configured
   * @returns boolean
   */
  isConfigured(): boolean {
    return this.isEnabled && !!this.apiKey && !!this.cloudName
  }
}
