import { IsArray, IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { ApiProperty } from '@nestjs/swagger'

export class PolicyDto {
  @IsUUID()
  @ApiProperty({ description: 'Policy UUID' })
  id: string

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Policy name', example: 'Comprehensive Auto' })
  name: string

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Policy provider' })
  provider: string

  @IsNumber()
  @ApiProperty({ description: 'Policy premium amount', example: 12.5 })
  premium: number

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Type of policy', example: 'auto' })
  policyType: string

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Policy description', required: false })
  description?: string

  @IsOptional()
  @ApiProperty({ description: 'Coverage details', required: false })
  coverageDetails?: Record<string, any>

  @IsOptional()
  @ApiProperty({ description: 'Benefits summary', required: false })
  benefits?: Record<string, any>

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'List of exclusions', type: [String], required: false })
  exclusions?: string[]
}

export class ComparePoliciesDto {
  @IsArray()
  @IsUUID("4", { each: true })
  @IsNotEmpty({ message: "At least two policy IDs are required for comparison." })
  @ApiProperty({ description: 'Array of policy UUIDs to compare', type: [String], example: ['uuid-1','uuid-2'] })
  policyIds: string[]
}

export class ComparisonFeatureDto {
  @IsString()
  @ApiProperty({ description: 'Feature name' })
  name: string

  @IsString()
  @ApiProperty({ description: 'Feature value type', example: 'currency' })
  type: "currency" | "text" | "boolean" | "list"

  @IsOptional()
  @ApiProperty({ description: 'Values per policy ID', required: false })
  values: {
    [policyId: string]: any
  }
}

export class PolicyComparisonResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyDto)
  @ApiProperty({ description: 'Policies included in comparison', type: [PolicyDto] })
  policies: PolicyDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComparisonFeatureDto)
  @ApiProperty({ description: 'Comparison table of features', type: [ComparisonFeatureDto] })
  comparisonTable: ComparisonFeatureDto[]
}
