import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common"
import { type Repository, Like } from "typeorm"
import { type Policy, AssetType, PolicyStatus, type CoveredAsset } from "../entities/policy.entity"
import type { CreatePolicyDto } from "../dto/create-policy.dto"
import type { UpdatePolicyDto } from "../dto/update-policy.dto"
import type { QueryPolicyDto } from "../dto/query-policy.dto"

@Injectable()
export class PolicyService {
  constructor(private readonly policyRepository: Repository<Policy>) {}

  async create(createPolicyDto: CreatePolicyDto): Promise<Policy> {
    // Validate dates
    const startDate = new Date(createPolicyDto.startDate)
    const expiryDate = new Date(createPolicyDto.expiryDate)

    if (startDate >= expiryDate) {
      throw new BadRequestException("Start date must be before expiry date")
    }

    if (startDate < new Date()) {
      throw new BadRequestException("Start date cannot be in the past")
    }

    // Validate and process covered assets
    const processedAssets = await this.validateAndProcessAssets(createPolicyDto.coveredAssets)

    // Check for duplicate assets
    this.checkForDuplicateAssets(processedAssets)

    // Calculate totals and premium
    const totalCoverageLimit = processedAssets.reduce((sum, asset) => sum + asset.coverageLimit, 0)
    const totalCurrentValue = processedAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
    const totalPremium = this.calculatePremium(processedAssets, startDate, expiryDate)

    // Generate policy number
    const policyNumber = await this.generatePolicyNumber()

    const policy = this.policyRepository.create({
      ...createPolicyDto,
      policyNumber,
      coveredAssets: processedAssets,
      totalCoverageLimit,
      totalCurrentValue,
      totalPremium,
      startDate,
      expiryDate,
      status: PolicyStatus.PENDING,
    })

    return await this.policyRepository.save(policy)
  }

  async findAll(queryDto: QueryPolicyDto): Promise<{ policies: Policy[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, ...filters } = queryDto
    const skip = (page - 1) * limit

    const queryBuilder = this.policyRepository.createQueryBuilder("policy")

    // Apply filters
    if (filters.userId) {
      queryBuilder.andWhere("policy.userId = :userId", { userId: filters.userId })
    }

    if (filters.status) {
      queryBuilder.andWhere("policy.status = :status", { status: filters.status })
    }

    if (filters.assetType) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(policy.coveredAssets) AS asset 
          WHERE asset->>'assetType' = :assetType
        )`,
        { assetType: filters.assetType },
      )
    }

    if (filters.expiryAfter) {
      queryBuilder.andWhere("policy.expiryDate > :expiryAfter", {
        expiryAfter: new Date(filters.expiryAfter),
      })
    }

    if (filters.expiryBefore) {
      queryBuilder.andWhere("policy.expiryDate < :expiryBefore", {
        expiryBefore: new Date(filters.expiryBefore),
      })
    }

    // Get total count
    const total = await queryBuilder.getCount()

    // Apply pagination and get results
    const policies = await queryBuilder.orderBy("policy.createdAt", "DESC").skip(skip).take(limit).getMany()

    return {
      policies,
      total,
      page,
      limit,
    }
  }

  async findOne(id: string): Promise<Policy> {
    const policy = await this.policyRepository.findOne({
      where: { id },
    })

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`)
    }

    return policy
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<Policy> {
    const policy = await this.findOne(id)

    // Validate dates if provided
    if (updatePolicyDto.startDate || updatePolicyDto.expiryDate) {
      const startDate = updatePolicyDto.startDate ? new Date(updatePolicyDto.startDate) : policy.startDate
      const expiryDate = updatePolicyDto.expiryDate ? new Date(updatePolicyDto.expiryDate) : policy.expiryDate

      if (startDate >= expiryDate) {
        throw new BadRequestException("Start date must be before expiry date")
      }
    }

    // Process covered assets if provided
    let processedAssets: CoveredAsset[] | undefined
    if (updatePolicyDto.coveredAssets) {
      processedAssets = await this.validateAndProcessAssets(updatePolicyDto.coveredAssets)
      this.checkForDuplicateAssets(processedAssets)
    }

    // Recalculate totals if assets changed
    const updatedData: Partial<Policy> = { ...updatePolicyDto }
    if (processedAssets) {
      updatedData.coveredAssets = processedAssets
      updatedData.totalCoverageLimit = processedAssets.reduce((sum, asset) => sum + asset.coverageLimit, 0)
      updatedData.totalCurrentValue = processedAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
      updatedData.totalPremium = this.calculatePremium(
        processedAssets,
        updatePolicyDto.startDate ? new Date(updatePolicyDto.startDate) : policy.startDate,
        updatePolicyDto.expiryDate ? new Date(updatePolicyDto.expiryDate) : policy.expiryDate,
      )
    }

    await this.policyRepository.update(id, updatedData)
    return await this.findOne(id)
  }

  async remove(id: string): Promise<void> {
    const policy = await this.findOne(id)

    if (policy.status === PolicyStatus.ACTIVE) {
      throw new BadRequestException("Cannot delete an active policy")
    }

    await this.policyRepository.remove(policy)
  }

  private async validateAndProcessAssets(assets: any[]): Promise<CoveredAsset[]> {
    const processedAssets: CoveredAsset[] = []

    for (const asset of assets) {
      // Validate required fields based on asset type
      if (asset.assetType === AssetType.NFT && !asset.contractAddress) {
        throw new BadRequestException(`Contract address is required for NFT assets`)
      }

      if (asset.assetType === AssetType.TOKEN && !asset.contractAddress) {
        throw new BadRequestException(`Contract address is required for token assets`)
      }

      // Validate coverage limit doesn't exceed current value by too much
      if (asset.coverageLimit > asset.currentValue * 1.5) {
        throw new BadRequestException(`Coverage limit for ${asset.symbol} cannot exceed 150% of current value`)
      }

      processedAssets.push({
        id: asset.id,
        symbol: asset.symbol.toUpperCase(),
        name: asset.name,
        assetType: asset.assetType,
        contractAddress: asset.contractAddress,
        tokenId: asset.tokenId,
        coverageLimit: asset.coverageLimit,
        currentValue: asset.currentValue,
        metadata: asset.metadata || {},
      })
    }

    return processedAssets
  }

  private checkForDuplicateAssets(assets: CoveredAsset[]): void {
    const assetKeys = new Set<string>()

    for (const asset of assets) {
      let key: string

      if (asset.assetType === AssetType.NFT) {
        key = `${asset.contractAddress}-${asset.tokenId}`
      } else if (asset.assetType === AssetType.TOKEN) {
        key = asset.contractAddress || asset.id
      } else {
        key = asset.id
      }

      if (assetKeys.has(key)) {
        throw new ConflictException(`Duplicate asset detected: ${asset.symbol}`)
      }

      assetKeys.add(key)
    }
  }

  private calculatePremium(assets: CoveredAsset[], startDate: Date, expiryDate: Date): number {
    const durationInDays = Math.ceil((expiryDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const durationInYears = durationInDays / 365

    let totalPremium = 0

    for (const asset of assets) {
      let riskMultiplier = 1

      // Different risk multipliers based on asset type
      switch (asset.assetType) {
        case AssetType.CRYPTOCURRENCY:
          riskMultiplier = 0.05 // 5% annual premium
          break
        case AssetType.TOKEN:
          riskMultiplier = 0.08 // 8% annual premium (higher risk)
          break
        case AssetType.NFT:
          riskMultiplier = 0.12 // 12% annual premium (highest risk)
          break
      }

      // Calculate premium for this asset
      const assetPremium = asset.coverageLimit * riskMultiplier * durationInYears
      totalPremium += assetPremium
    }

    // Apply multi-asset discount (5% discount for 3+ assets, 10% for 5+ assets)
    if (assets.length >= 5) {
      totalPremium *= 0.9 // 10% discount
    } else if (assets.length >= 3) {
      totalPremium *= 0.95 // 5% discount
    }

    return Math.round(totalPremium * 100) / 100 // Round to 2 decimal places
  }

  private async generatePolicyNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.policyRepository.count({
      where: {
        policyNumber: Like(`POL-${year}-%`),
      },
    })

    return `POL-${year}-${String(count + 1).padStart(6, "0")}`
  }
}
