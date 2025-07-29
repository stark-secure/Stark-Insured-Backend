export interface ImageUploadConfig {
  maxFileSize: number // in bytes
  allowedFormats: string[] // e.g., ['jpg', 'jpeg', 'png', 'webp']
  compressionQuality: number // 0-100
  maxWidth: number
  maxHeight: number
  enableWebP: boolean
  enableCDN: boolean
}

export interface ImageMetadata {
  originalName: string
  filename: string
  mimetype: string
  size: number
  width: number
  height: number
  format: string
  hasAlpha: boolean
  colorSpace: string
}

export interface ProcessedImage {
  buffer: Buffer
  metadata: ImageMetadata
  compressionRatio: number
  originalSize: number
  compressedSize: number
}

export interface UploadResult {
  success: boolean
  message: string
  data?: {
    id: string
    originalName: string
    filename: string
    url: string
    cdnUrl?: string
    size: number
    compressedSize: number
    compressionRatio: number
    metadata: ImageMetadata
    uploadedAt: Date
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface ImageVariant {
  name: string
  width: number
  height: number
  quality: number
  format?: string
}

export interface CDNUploadResult {
  success: boolean
  url: string
  cdnUrl: string
  publicId?: string
  error?: string
}

export interface StorageProvider {
  upload(buffer: Buffer, filename: string, metadata: ImageMetadata): Promise<string>
  delete(filename: string): Promise<boolean>
  getUrl(filename: string): string
}
