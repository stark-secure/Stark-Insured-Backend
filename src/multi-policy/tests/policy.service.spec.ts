import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { BadRequestException, NotFoundException, ConflictException } from "@nestjs/common"
import { PolicyService } from "../services/policy.service"
import { Policy, AssetType, PolicyStatus } from "../entities/policy.entity"
import type { CreatePolicyDto } from "../dto/create-policy.dto"
import type { UpdatePolicyDto } from "../dto/update-policy.dto"
import { jest } from "@jest/globals" // Import jest to declare it

describe("PolicyService", () => {
  let service: PolicyService
  let repository: Repository<Policy>

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getMany: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        {
          provide: getRepositoryToken(Policy),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<PolicyService>(PolicyService)
    repository = module.get<Repository<Policy>>(getRepositoryToken(Policy))

    // Reset mocks
    jest.clearAllMocks()
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder)
  })

  describe("create", () => {
    const validCreateDto: CreatePolicyDto = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      coveredAssets: [
        {
          id: "eth-ethereum",
          symbol: "ETH",
          name: "Ethereum",
          assetType: AssetType.CRYPTOCURRENCY,
          coverageLimit: 10000,
          currentValue: 8500,
        },
        {
          id: "usdc-usd-coin",
          symbol: "USDC",
          name: "USD Coin",
          assetType: AssetType.TOKEN,
          contractAddress: "0xA0b86a33E6441c8C7c07b68c2c4c0b8e0b8e0b8e",
          coverageLimit: 5000,
          currentValue: 5000,
        },
      ],
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      expiryDate: new Date(Date.now() + 31536000000).toISOString(), // Next year
      description: "Test multi-asset policy",
    }

    it("should create a policy successfully", async () => {
      const expectedPolicy = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        ...validCreateDto,
        policyNumber: "POL-2024-000001",
        totalCoverageLimit: 15000,
        totalCurrentValue: 13500,
        totalPremium: 1012.5,
        status: PolicyStatus.PENDING,
      }

      mockRepository.count.mockResolvedValue(0)
      mockRepository.create.mockReturnValue(expectedPolicy)
      mockRepository.save.mockResolvedValue(expectedPolicy)

      const result = await service.create(validCreateDto)

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: validCreateDto.userId,
          coveredAssets: expect.arrayContaining([
            expect.objectContaining({
              symbol: "ETH",
              assetType: AssetType.CRYPTOCURRENCY,
            }),
            expect.objectContaining({
              symbol: "USDC",
              assetType: AssetType.TOKEN,
            }),
          ]),
          totalCoverageLimit: 15000,
          totalCurrentValue: 13500,
          status: PolicyStatus.PENDING,
        }),
      )
      expect(mockRepository.save).toHaveBeenCalled()
      expect(result).toEqual(expectedPolicy)
    })

    it("should throw BadRequestException for invalid dates", async () => {
      const invalidDto = {
        ...validCreateDto,
        startDate: new Date(Date.now() + 31536000000).toISOString(), // Next year
        expiryDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      }

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException)
    })

    it("should throw BadRequestException for past start date", async () => {
      const invalidDto = {
        ...validCreateDto,
        startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      }

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException)
    })

    it("should throw ConflictException for duplicate assets", async () => {
      const duplicateDto = {
        ...validCreateDto,
        coveredAssets: [
          validCreateDto.coveredAssets[0],
          validCreateDto.coveredAssets[0], // Duplicate
        ],
      }

      await expect(service.create(duplicateDto)).rejects.toThrow(ConflictException)
    })

    it("should throw BadRequestException for NFT without contract address", async () => {
      const invalidDto = {
        ...validCreateDto,
        coveredAssets: [
          {
            id: "nft-test",
            symbol: "NFT",
            name: "Test NFT",
            assetType: AssetType.NFT,
            coverageLimit: 1000,
            currentValue: 800,
            // Missing contractAddress
          },
        ],
      }

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException)
    })

    it("should throw BadRequestException for excessive coverage limit", async () => {
      const invalidDto = {
        ...validCreateDto,
        coveredAssets: [
          {
            id: "eth-ethereum",
            symbol: "ETH",
            name: "Ethereum",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 20000, // 200% of current value
            currentValue: 10000,
          },
        ],
      }

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException)
    })
  })

  describe("findAll", () => {
    it("should return paginated policies", async () => {
      const mockPolicies = [
        {
          id: "1",
          userId: "123e4567-e89b-12d3-a456-426614174000",
          status: PolicyStatus.ACTIVE,
        },
      ]

      mockQueryBuilder.getCount.mockResolvedValue(1)
      mockQueryBuilder.getMany.mockResolvedValue(mockPolicies)

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result).toEqual({
        policies: mockPolicies,
        total: 1,
        page: 1,
        limit: 10,
      })
    })

    it("should apply filters correctly", async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0)
      mockQueryBuilder.getMany.mockResolvedValue([])

      await service.findAll({
        userId: "123e4567-e89b-12d3-a456-426614174000",
        status: PolicyStatus.ACTIVE,
        assetType: AssetType.CRYPTOCURRENCY,
        page: 1,
        limit: 10,
      })

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("policy.userId = :userId", {
        userId: "123e4567-e89b-12d3-a456-426614174000",
      })
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("policy.status = :status", { status: PolicyStatus.ACTIVE })
    })
  })

  describe("findOne", () => {
    it("should return a policy by id", async () => {
      const mockPolicy = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        userId: "123e4567-e89b-12d3-a456-426614174001",
        status: PolicyStatus.ACTIVE,
      }

      mockRepository.findOne.mockResolvedValue(mockPolicy)

      const result = await service.findOne("123e4567-e89b-12d3-a456-426614174000")

      expect(result).toEqual(mockPolicy)
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "123e4567-e89b-12d3-a456-426614174000" },
      })
    })

    it("should throw NotFoundException when policy not found", async () => {
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(NotFoundException)
    })
  })

  describe("update", () => {
    const mockPolicy = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId: "123e4567-e89b-12d3-a456-426614174001",
      status: PolicyStatus.ACTIVE,
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 31536000000),
      coveredAssets: [
        {
          id: "eth-ethereum",
          symbol: "ETH",
          name: "Ethereum",
          assetType: AssetType.CRYPTOCURRENCY,
          coverageLimit: 10000,
          currentValue: 8500,
        },
      ],
    }

    it("should update a policy successfully", async () => {
      const updateDto: UpdatePolicyDto = {
        description: "Updated description",
      }

      mockRepository.findOne.mockResolvedValue(mockPolicy)
      mockRepository.update.mockResolvedValue({ affected: 1 })
      mockRepository.findOne.mockResolvedValueOnce(mockPolicy).mockResolvedValueOnce({
        ...mockPolicy,
        ...updateDto,
      })

      const result = await service.update("123e4567-e89b-12d3-a456-426614174000", updateDto)

      expect(mockRepository.update).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000", updateDto)
      expect(result.description).toBe("Updated description")
    })

    it("should recalculate totals when assets are updated", async () => {
      const updateDto: UpdatePolicyDto = {
        coveredAssets: [
          {
            id: "btc-bitcoin",
            symbol: "BTC",
            name: "Bitcoin",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 20000,
            currentValue: 18000,
          },
        ],
      }

      mockRepository.findOne.mockResolvedValue(mockPolicy)
      mockRepository.update.mockResolvedValue({ affected: 1 })
      mockRepository.findOne.mockResolvedValueOnce(mockPolicy).mockResolvedValueOnce({
        ...mockPolicy,
        ...updateDto,
      })

      await service.update("123e4567-e89b-12d3-a456-426614174000", updateDto)

      expect(mockRepository.update).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        expect.objectContaining({
          coveredAssets: expect.arrayContaining([
            expect.objectContaining({
              symbol: "BTC",
              coverageLimit: 20000,
            }),
          ]),
          totalCoverageLimit: 20000,
          totalCurrentValue: 18000,
        }),
      )
    })
  })

  describe("remove", () => {
    it("should remove a non-active policy", async () => {
      const mockPolicy = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: PolicyStatus.EXPIRED,
      }

      mockRepository.findOne.mockResolvedValue(mockPolicy)
      mockRepository.remove.mockResolvedValue(mockPolicy)

      await service.remove("123e4567-e89b-12d3-a456-426614174000")

      expect(mockRepository.remove).toHaveBeenCalledWith(mockPolicy)
    })

    it("should throw BadRequestException for active policy", async () => {
      const mockPolicy = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: PolicyStatus.ACTIVE,
      }

      mockRepository.findOne.mockResolvedValue(mockPolicy)

      await expect(service.remove("123e4567-e89b-12d3-a456-426614174000")).rejects.toThrow(BadRequestException)
    })
  })

  describe("premium calculation", () => {
    it("should calculate premium correctly for different asset types", async () => {
      const createDto: CreatePolicyDto = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        coveredAssets: [
          {
            id: "eth-ethereum",
            symbol: "ETH",
            name: "Ethereum",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 10000,
            currentValue: 8500,
          },
          {
            id: "nft-test",
            symbol: "NFT",
            name: "Test NFT",
            assetType: AssetType.NFT,
            contractAddress: "0xA0b86a33E6441c8C7c07b68c2c4c0b8e0b8e0b8e",
            tokenId: "1",
            coverageLimit: 5000,
            currentValue: 4000,
          },
        ],
        startDate: new Date(Date.now() + 86400000).toISOString(),
        expiryDate: new Date(Date.now() + 31536000000).toISOString(), // 1 year
      }

      mockRepository.count.mockResolvedValue(0)
      mockRepository.create.mockImplementation((data) => data)
      mockRepository.save.mockImplementation((data) => Promise.resolve(data))

      const result = await service.create(createDto)

      // ETH: 10000 * 0.05 = 500
      // NFT: 5000 * 0.12 = 600
      // Total: 1100, no discount (only 2 assets)
      expect(result.totalPremium).toBe(1100)
    })

    it("should apply multi-asset discount", async () => {
      const createDto: CreatePolicyDto = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        coveredAssets: [
          {
            id: "eth-ethereum",
            symbol: "ETH",
            name: "Ethereum",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 10000,
            currentValue: 8500,
          },
          {
            id: "btc-bitcoin",
            symbol: "BTC",
            name: "Bitcoin",
            assetType: AssetType.CRYPTOCURRENCY,
            coverageLimit: 10000,
            currentValue: 9000,
          },
          {
            id: "usdc-usd-coin",
            symbol: "USDC",
            name: "USD Coin",
            assetType: AssetType.TOKEN,
            contractAddress: "0xA0b86a33E6441c8C7c07b68c2c4c0b8e0b8e0b8e",
            coverageLimit: 5000,
            currentValue: 5000,
          },
        ],
        startDate: new Date(Date.now() + 86400000).toISOString(),
        expiryDate: new Date(Date.now() + 31536000000).toISOString(),
      }

      mockRepository.count.mockResolvedValue(0)
      mockRepository.create.mockImplementation((data) => data)
      mockRepository.save.mockImplementation((data) => Promise.resolve(data))

      const result = await service.create(createDto)

      // ETH: 10000 * 0.05 = 500
      // BTC: 10000 * 0.05 = 500
      // USDC: 5000 * 0.08 = 400
      // Total: 1400 * 0.95 (5% discount for 3+ assets) = 1330
      expect(result.totalPremium).toBe(1330)
    })
  })
})
