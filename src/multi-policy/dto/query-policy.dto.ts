import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsOptional, IsEnum, IsUUID, IsDateString, IsNumber, Min, Max } from "class-validator"
import { Type } from "class-transformer"
import { PolicyStatus, AssetType } from "../entities/policy.entity"

export class QueryPolicyDto {
  @ApiPropertyOptional({
    description: "Filter by user ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  userId?: string

  @ApiPropertyOptional({
    description: "Filter by policy status",
    enum: PolicyStatus,
  })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus

  @ApiPropertyOptional({
    description: "Filter by asset type",
    enum: AssetType,
  })
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType

  @ApiPropertyOptional({
    description: "Filter policies expiring after this date",
    example: "2024-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  expiryAfter?: string

  @ApiPropertyOptional({
    description: "Filter policies expiring before this date",
    example: "2024-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  expiryBefore?: string

  @ApiPropertyOptional({
    description: "Page number for pagination",
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    description: "Number of items per page",
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10
}
