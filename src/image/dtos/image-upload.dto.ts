import { IsOptional, IsBoolean, IsNumber, Min, Max, IsString, IsArray, ValidateNested } from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class UploadOptionsDto {
  @ApiProperty({ description: 'Image quality (10-100)', required: false, example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  @Transform(({ value }) => Number.parseInt(value))
  quality?: number

  @ApiProperty({ description: 'Whether to create variants', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  createVariants?: boolean

  @ApiProperty({ description: 'Whether to upload to CDN', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  uploadToCDN?: boolean

  @ApiProperty({ description: 'Max concurrent uploads', required: false, example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => Number.parseInt(value))
  maxConcurrent?: number
}

export class ImageVariantDto {
  @ApiProperty({ description: 'Variant name', example: 'thumbnail' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Variant width in px', example: 200 })
  @IsNumber()
  @Min(50)
  @Max(2048)
  width: number

  @ApiProperty({ description: 'Variant height in px', example: 200 })
  @IsNumber()
  @Min(50)
  @Max(2048)
  height: number

  @ApiProperty({ description: 'Variant quality 10-100', example: 75 })
  @IsNumber()
  @Min(10)
  @Max(100)
  quality: number

  @ApiProperty({ description: 'Optional format, e.g., jpeg, png', required: false })
  @IsOptional()
  @IsString()
  format?: string
}

export class BatchUploadOptionsDto extends UploadOptionsDto {
  @ApiProperty({ description: 'Custom variants array', type: [ImageVariantDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageVariantDto)
  customVariants?: ImageVariantDto[]
}

export class DeleteImageDto {
  @ApiProperty({ description: 'Filename to delete' })
  @IsString()
  filename: string

  @ApiProperty({ description: 'Public id in CDN (optional)', required: false })
  @IsOptional()
  @IsString()
  publicId?: string
}
import { IsOptional, IsBoolean, IsNumber, Min, Max, IsString, IsArray, ValidateNested } from 'class-validator'
import { Type, Transform } from 'class-transformer'

import { ApiProperty } from '@nestjs/swagger'

export class UploadOptionsDto {
  @ApiProperty({ description: 'Image quality (10-100)', required: false, example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  @Transform(({ value }) => Number.parseInt(value))
  quality?: number

  @ApiProperty({ description: 'Whether to create variants', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  createVariants?: boolean

  @ApiProperty({ description: 'Whether to upload to CDN', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  uploadToCDN?: boolean

  @ApiProperty({ description: 'Max concurrent uploads', required: false, example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => Number.parseInt(value))
  maxConcurrent?: number
}

export class ImageVariantDto {
  @ApiProperty({ description: 'Variant name', example: 'thumbnail' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Variant width in px', example: 200 })
  @IsNumber()
  @Min(50)
  @Max(2048)
  width: number

  @ApiProperty({ description: 'Variant height in px', example: 200 })
  @IsNumber()
  @Min(50)
  @Max(2048)
  height: number

  @ApiProperty({ description: 'Variant quality 10-100', example: 75 })
  @IsNumber()
  @Min(10)
  @Max(100)
  quality: number

  @ApiProperty({ description: 'Optional format, e.g., jpeg, png', required: false })
  @IsOptional()
  @IsString()
  format?: string
}

export class BatchUploadOptionsDto extends UploadOptionsDto {
  @ApiProperty({ description: 'Custom variants array', type: [ImageVariantDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageVariantDto)
  customVariants?: ImageVariantDto[]
}

export class DeleteImageDto {
  @ApiProperty({ description: 'Filename to delete' })
  @IsString()
  filename: string

  @ApiProperty({ description: 'Public id in CDN (optional)', required: false })
  @IsOptional()
  @IsString()
  publicId?: string
}
import { IsOptional, IsBoolean, IsNumber, Min, Max, IsString, IsArray, ValidateNested } from 'class-validator'
import { Type, Transform } from 'class-transformer'

import { ApiProperty } from '@nestjs/swagger'

export class UploadOptionsDto {
  @ApiProperty({ description: 'Image quality (10-100)', required: false, example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  @Transform(({ value }) => Number.parseInt(value))
  quality?: number

  @ApiProperty({ description: 'Whether to create variants', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  createVariants?: boolean

  @ApiProperty({ description: 'Whether to upload to CDN', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  uploadToCDN?: boolean

  @ApiProperty({ description: 'Max concurrent uploads', required: false, example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => Number.parseInt(value))
  maxConcurrent?: number
}

export class ImageVariantDto {
  @ApiProperty({ description: 'Variant name', example: 'thumbnail' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Variant width in px', example: 200 })
  @IsNumber()
  @Min(50)
  @Max(2048)
  width: number

  @ApiProperty({ description: 'Variant height in px', example: 200 })
  @IsNumber()
  @Min(50)
  @Max(2048)
  height: number

  @ApiProperty({ description: 'Variant quality 10-100', example: 75 })
  @IsNumber()
  @Min(10)
  @Max(100)
  quality: number

  @ApiProperty({ description: 'Optional format, e.g., jpeg, png', required: false })
  @IsOptional()
  @IsString()
  format?: string
}

export class BatchUploadOptionsDto extends UploadOptionsDto {
  @ApiProperty({ description: 'Custom variants array', type: [ImageVariantDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageVariantDto)
  customVariants?: ImageVariantDto[]
}

export class DeleteImageDto {
  @ApiProperty({ description: 'Filename to delete' })
  @IsString()
  filename: string

  @ApiProperty({ description: 'Public id in CDN (optional)', required: false })
  @IsOptional()
  @IsString()
  publicId?: string
}
+
+
import { IsOptional, IsBoolean, IsNumber, Min, Max, IsString, IsArray, ValidateNested } from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class UploadOptionsDto {
  @ApiProperty({ description: 'Image quality (10-100)', required: false, example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  @Transform(({ value }) => Number.parseInt(value))
  quality?: number

  @ApiProperty({ description: 'Whether to create variants', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  createVariants?: boolean

  @ApiProperty({ description: 'Whether to upload to CDN', required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  uploadToCDN?: boolean

  @ApiProperty({ description: 'Max concurrent uploads', required: false, example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => Number.parseInt(value))
  maxConcurrent?: number
}

export class ImageVariantDto {
  @ApiProperty({ description: 'Variant name', example: 'thumbnail' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Variant width in px', example: 200 })
  @IsNumber()
  @Min(50)
  @Max(2048)
  width: number

  @ApiProperty({ description: 'Variant height in px', example: 200 })
  @IsNumber()
  @Min(50)
  @Max(2048)
  height: number

  @ApiProperty({ description: 'Variant quality 10-100', example: 75 })
  @IsNumber()
  @Min(10)
  @Max(100)
  quality: number

  @ApiProperty({ description: 'Optional format, e.g., jpeg, png', required: false })
  @IsOptional()
  @IsString()
  format?: string
}

export class BatchUploadOptionsDto extends UploadOptionsDto {
  @ApiProperty({ description: 'Custom variants array', type: [ImageVariantDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageVariantDto)
  customVariants?: ImageVariantDto[]
}

export class DeleteImageDto {
  @ApiProperty({ description: 'Filename to delete' })
  @IsString()
  filename: string

  @ApiProperty({ description: 'Public id in CDN (optional)', required: false })
  @IsOptional()
  @IsString()
  publicId?: string
}

import { IsOptional, IsBoolean, IsNumber, Min, Max, IsString, IsArray, ValidateNested } from "class-validator"
import { Type, Transform } from "class-transformer"

import { ApiProperty } from '@nestjs/swagger'
+
+
+export class UploadOptionsDto {
+  @ApiProperty({ description: 'Image quality (10-100)', required: false, example: 80 })
+  @IsOptional()
+  @IsNumber()
+  @Min(10)
+  @Max(100)
+  @Transform(({ value }) => Number.parseInt(value))
+  quality?: number
+
+  @ApiProperty({ description: 'Whether to create variants', required: false })
+  @IsOptional()
+  @IsBoolean()
+  @Transform(({ value }) => value === "true" || value === true)
+  createVariants?: boolean
+
+  @ApiProperty({ description: 'Whether to upload to CDN', required: false })
+  @IsOptional()
+  @IsBoolean()
+  @Transform(({ value }) => value === "true" || value === true)
+  uploadToCDN?: boolean
+
+  @ApiProperty({ description: 'Max concurrent uploads', required: false, example: 3 })
+  @IsOptional()
+  @IsNumber()
+  @Min(1)
+  @Max(10)
+  @Transform(({ value }) => Number.parseInt(value))
+  maxConcurrent?: number
+}
+
+export class ImageVariantDto {
+  @ApiProperty({ description: 'Variant name', example: 'thumbnail' })
+  @IsString()
+  name: string
+
+  @ApiProperty({ description: 'Variant width in px', example: 200 })
+  @IsNumber()
+  @Min(50)
+  @Max(2048)
+  width: number
+
+  @ApiProperty({ description: 'Variant height in px', example: 200 })
+  @IsNumber()
+  @Min(50)
+  @Max(2048)
+  height: number
+
+  @ApiProperty({ description: 'Variant quality 10-100', example: 75 })
+  @IsNumber()
+  @Min(10)
+  @Max(100)
+  quality: number
+
+  @ApiProperty({ description: 'Optional format, e.g., jpeg, png', required: false })
+  @IsOptional()
+  @IsString()
+  format?: string
+}
+
+export class BatchUploadOptionsDto extends UploadOptionsDto {
+  @ApiProperty({ description: 'Custom variants array', type: [ImageVariantDto], required: false })
+  @IsOptional()
+  @IsArray()
+  @ValidateNested({ each: true })
+  @Type(() => ImageVariantDto)
+  customVariants?: ImageVariantDto[]
+}
+
+export class DeleteImageDto {
+  @ApiProperty({ description: 'Filename to delete' })
+  @IsString()
+  filename: string
+
+  @ApiProperty({ description: 'Public id in CDN (optional)', required: false })
+  @IsOptional()
+  @IsString()
+  publicId?: string
+}
