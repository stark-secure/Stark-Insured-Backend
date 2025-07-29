import { HttpException, HttpStatus } from "@nestjs/common"
import { ImageUploadError } from "../enums/image-upload.enum"

export class ImageUploadException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly errorCode?: ImageUploadError,
  ) {
    super(message, statusCode)
  }
}

export class InvalidImageFormatException extends ImageUploadException {
  constructor(format: string, allowedFormats: string[]) {
    super(
      `Invalid image format '${format}'. Allowed formats: ${allowedFormats.join(", ")}`,
      HttpStatus.BAD_REQUEST,
      ImageUploadError.INVALID_FORMAT,
    )
  }
}

export class FileSizeExceededException extends ImageUploadException {
  constructor(size: number, maxSize: number) {
    super(
      `File size ${Math.round(size / 1024)}KB exceeds maximum allowed size of ${Math.round(maxSize / 1024)}KB`,
      HttpStatus.BAD_REQUEST,
      ImageUploadError.FILE_TOO_LARGE,
    )
  }
}

export class InvalidImageDimensionsException extends ImageUploadException {
  constructor(width: number, height: number, maxWidth: number, maxHeight: number) {
    super(
      `Image dimensions ${width}x${height} exceed maximum allowed dimensions of ${maxWidth}x${maxHeight}`,
      HttpStatus.BAD_REQUEST,
      ImageUploadError.INVALID_DIMENSIONS,
    )
  }
}

export class ImageCompressionException extends ImageUploadException {
  constructor(message: string) {
    super(`Image compression failed: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR, ImageUploadError.COMPRESSION_FAILED)
  }
}

export class ImageUploadFailedException extends ImageUploadException {
  constructor(message: string) {
    super(`Image upload failed: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR, ImageUploadError.UPLOAD_FAILED)
  }
}
