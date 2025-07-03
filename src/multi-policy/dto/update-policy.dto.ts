import { PartialType, ApiPropertyOptional } from "@nestjs/swagger"
import { CreatePolicyDto, CreateCoveredAssetDto } from "./create-policy.dto"
import { IsArray, IsEnum, IsOptional, ValidateNested, ArrayMinSize } from "class-validator"
import { Type } from "class-transformer"
import { PolicyStatus } from "../entities/policy.entity"

export class UpdateCoveredAssetDto extends PartialType(CreateCoveredAssetDto) {}

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {
  @ApiPropertyOptional({
    description: "Updated array of covered assets",
    type: [UpdateCoveredAssetDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateCoveredAssetDto)
  coveredAssets?: UpdateCoveredAssetDto[]

  @ApiPropertyOptional({
    description: "Policy status",
    enum: PolicyStatus,
  })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus
}
