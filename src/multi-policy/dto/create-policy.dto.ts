import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
  IsEthereumAddress,
} from "class-validator"
import { Type } from "class-transformer"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { AssetType } from "../entities/policy.entity"

export class CreateCoveredAssetDto {
  @ApiProperty({
    description: "Unique identifier for the asset",
    example: "eth-ethereum",
  })
  @IsString()
  @IsNotEmpty()
  id: string

  @ApiProperty({
    description: "Asset symbol",
    example: "ETH",
  })
  @IsString()
  @IsNotEmpty()
  symbol: string

  @ApiProperty({
    description: "Asset name",
    example: "Ethereum",
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: "Type of asset",
    enum: AssetType,
    example: AssetType.CRYPTOCURRENCY,
  })
  @IsEnum(AssetType)
  assetType: AssetType

  @ApiPropertyOptional({
    description: "Smart contract address for tokens/NFTs",
    example: "0xA0b86a33E6441c8C7c07b68c2c4c0b8e0b8e0b8e",
  })
  @IsOptional()
  @IsEthereumAddress()
  contractAddress?: string

  @ApiPropertyOptional({
    description: "Token ID for NFTs",
    example: "1234",
  })
  @IsOptional()
  @IsString()
  tokenId?: string

  @ApiProperty({
    description: "Maximum coverage amount for this asset",
    example: 10000,
    minimum: 1,
    maximum: 1000000,
  })
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(1)
  @Max(1000000)
  coverageLimit: number

  @ApiProperty({
    description: "Current market value of the asset",
    example: 8500,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  currentValue: number

  @ApiPropertyOptional({
    description: "Additional metadata for the asset",
    example: { rarity: "legendary", collection: "CryptoPunks" },
  })
  @IsOptional()
  metadata?: Record<string, any>
}

export class CreatePolicyDto {
  @ApiProperty({
    description: "User ID who owns the policy",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  userId: string

  @ApiProperty({
    description: "Array of assets to be covered by the policy",
    type: [CreateCoveredAssetDto],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCoveredAssetDto)
  coveredAssets: CreateCoveredAssetDto[]

  @ApiProperty({
    description: "Policy start date",
    example: "2024-01-01T00:00:00Z",
  })
  @IsDateString()
  startDate: string

  @ApiProperty({
    description: "Policy expiry date",
    example: "2024-12-31T23:59:59Z",
  })
  @IsDateString()
  expiryDate: string

  @ApiPropertyOptional({
    description: "Policy terms and conditions",
    example: { deductible: 500, claimLimit: 2 },
  })
  @IsOptional()
  terms?: Record<string, any>

  @ApiPropertyOptional({
    description: "Policy description",
    example: "Multi-asset crypto portfolio insurance",
  })
  @IsOptional()
  @IsString()
  description?: string
}
