import { IsOptional, IsBoolean, IsNumber, Min, Max, IsString, IsArray, ValidateNested } from "class-validator"
import { Type, Transform } from "class-transformer"

export class UploadOptionsDto {
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  @Transform(({ value }) => Number.parseInt(value))
  quality?: number

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  createVariants?: boolean

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  uploadToCDN?: boolean

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => Number.parseInt(value))
  maxConcurrent?: number
}

export class ImageVariantDto {
  @IsString()
  name: string

  @IsNumber()
  @Min(50)
  @Max(2048)
  width: number

  @IsNumber()
  @Min(50)
  @Max(2048)
  height: number

  @IsNumber()
  @Min(10)
  @Max(100)
  quality: number

  @IsOptional()
  @IsString()
  format?: string
}

export class BatchUploadOptionsDto extends UploadOptionsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageVariantDto)
  customVariants?: ImageVariantDto[]
}

export class DeleteImageDto {
  @IsString()
  filename: string

  @IsOptional()
  @IsString()
  publicId?: string
}
