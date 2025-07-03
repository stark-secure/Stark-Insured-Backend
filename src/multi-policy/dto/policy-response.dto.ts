import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { AssetType, PolicyStatus } from "../entities/policy.entity"

export class CoveredAssetResponseDto {
  @ApiProperty({ example: "eth-ethereum" })
  id: string

  @ApiProperty({ example: "ETH" })
  symbol: string

  @ApiProperty({ example: "Ethereum" })
  name: string

  @ApiProperty({ enum: AssetType, example: AssetType.CRYPTOCURRENCY })
  assetType: AssetType

  @ApiPropertyOptional({ example: "0xA0b86a33E6441c8C7c07b68c2c4c0b8e0b8e0b8e" })
  contractAddress?: string

  @ApiPropertyOptional({ example: "1234" })
  tokenId?: string

  @ApiProperty({ example: 10000 })
  coverageLimit: number

  @ApiProperty({ example: 8500 })
  currentValue: number

  @ApiPropertyOptional({ example: { rarity: "legendary" } })
  metadata?: Record<string, any>
}

export class PolicyResponseDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  userId: string

  @ApiProperty({ example: "POL-2024-001234" })
  policyNumber: string

  @ApiProperty({ type: [CoveredAssetResponseDto] })
  coveredAssets: CoveredAssetResponseDto[]

  @ApiProperty({ example: 50000 })
  totalCoverageLimit: number

  @ApiProperty({ example: 2500 })
  totalPremium: number

  @ApiProperty({ example: 45000 })
  totalCurrentValue: number

  @ApiProperty({ enum: PolicyStatus, example: PolicyStatus.ACTIVE })
  status: PolicyStatus

  @ApiProperty({ example: "2024-01-01T00:00:00Z" })
  startDate: Date

  @ApiProperty({ example: "2024-12-31T23:59:59Z" })
  expiryDate: Date

  @ApiPropertyOptional({ example: { deductible: 500 } })
  terms?: Record<string, any>

  @ApiPropertyOptional({ example: "Multi-asset portfolio insurance" })
  description?: string

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiProperty({ example: 180 })
  daysUntilExpiry: number

  @ApiProperty({ example: "2024-01-01T00:00:00Z" })
  createdAt: Date

  @ApiProperty({ example: "2024-01-01T00:00:00Z" })
  updatedAt: Date
}
