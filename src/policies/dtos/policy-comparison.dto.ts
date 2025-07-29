import { IsArray, IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, ValidateNested } from "class-validator"
import { Type } from "class-transformer"

export class PolicyDto {
  @IsUUID()
  id: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  provider: string

  @IsNumber()
  premium: number

  @IsString()
  @IsNotEmpty()
  policyType: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  coverageDetails?: Record<string, any>

  @IsOptional()
  benefits?: Record<string, any>

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclusions?: string[]
}

export class ComparePoliciesDto {
  @IsArray()
  @IsUUID("4", { each: true })
  @IsNotEmpty({ message: "At least two policy IDs are required for comparison." })
  policyIds: string[]
}

export class ComparisonFeatureDto {
  @IsString()
  name: string

  @IsString()
  type: "currency" | "text" | "boolean" | "list"

  @IsOptional()
  values: {
    [policyId: string]: any
  }
}

export class PolicyComparisonResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyDto)
  policies: PolicyDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComparisonFeatureDto)
  comparisonTable: ComparisonFeatureDto[]
}
