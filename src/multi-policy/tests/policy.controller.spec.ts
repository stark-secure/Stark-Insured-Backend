import { Test, type TestingModule } from "@nestjs/testing"
import { BadRequestException, NotFoundException } from "@nestjs/common"
import { PolicyController } from "../controllers/policy.controller"
import { PolicyService } from "../services/policy.service"
import type { CreatePolicyDto } from "../dto/create-policy.dto"
import type { UpdatePolicyDto } from "../dto/update-policy.dto"
import type { QueryPolicyDto } from "../dto/query-policy.dto"
import { AssetType, PolicyStatus } from "../entities/policy.entity"
import { jest } from "@jest/globals" // Import jest to declare it

describe("PolicyController", () => {
  let controller: PolicyController
  let service: PolicyService

  const mockPolicyService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolicyController],
      providers: [
        {
          provide: PolicyService,
          useValue: mockPolicyService,
        },
      ],
    }).compile()

    controller = module.get<PolicyController>(PolicyController)
    service = module.get<PolicyService>(PolicyService)

    jest.clearAllMocks()
  })

  describe("create", () => {
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
      ],
      startDate: new Date(Date.now() + 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 31536000000).toISOString(),
    }

    it("should create a policy", async () => {
      const expectedResult = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        ...createDto,
        policyNumber: "POL-2024-000001",
        status: PolicyStatus.PENDING,
      }

      mockPolicyService.create.mockResolvedValue(expectedResult)

      const result = await controller.create(createDto)

      expect(service.create).toHaveBeenCalledWith(createDto)
      expect(result).toEqual(expectedResult)
    })

    it("should handle service errors", async () => {
      mockPolicyService.create.mockRejectedValue(new BadRequestException("Invalid data"))

      await expect(controller.create(createDto)).rejects.toThrow(BadRequestException)
    })
  })

  describe("findAll", () => {
    it("should return paginated policies", async () => {
      const queryDto: QueryPolicyDto = { page: 1, limit: 10 }
      const expectedResult = {
        policies: [],
        total: 0,
        page: 1,
        limit: 10,
      }

      mockPolicyService.findAll.mockResolvedValue(expectedResult)

      const result = await controller.findAll(queryDto)

      expect(service.findAll).toHaveBeenCalledWith(queryDto)
      expect(result).toEqual(expectedResult)
    })

    it("should handle filters", async () => {
      const queryDto: QueryPolicyDto = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        status: PolicyStatus.ACTIVE,
        assetType: AssetType.CRYPTOCURRENCY,
        page: 1,
        limit: 10,
      }

      mockPolicyService.findAll.mockResolvedValue({
        policies: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      await controller.findAll(queryDto)

      expect(service.findAll).toHaveBeenCalledWith(queryDto)
    })
  })

  describe("findOne", () => {
    it("should return a policy by id", async () => {
      const policyId = "123e4567-e89b-12d3-a456-426614174000"
      const expectedPolicy = {
        id: policyId,
        userId: "123e4567-e89b-12d3-a456-426614174001",
        status: PolicyStatus.ACTIVE,
      }

      mockPolicyService.findOne.mockResolvedValue(expectedPolicy)

      const result = await controller.findOne(policyId)

      expect(service.findOne).toHaveBeenCalledWith(policyId)
      expect(result).toEqual(expectedPolicy)
    })

    it("should handle not found error", async () => {
      const policyId = "nonexistent-id"
      mockPolicyService.findOne.mockRejectedValue(new NotFoundException())

      await expect(controller.findOne(policyId)).rejects.toThrow(NotFoundException)
    })
  })

  describe("update", () => {
    it("should update a policy", async () => {
      const policyId = "123e4567-e89b-12d3-a456-426614174000"
      const updateDto: UpdatePolicyDto = {
        description: "Updated description",
      }
      const expectedResult = {
        id: policyId,
        description: "Updated description",
      }

      mockPolicyService.update.mockResolvedValue(expectedResult)

      const result = await controller.update(policyId, updateDto)

      expect(service.update).toHaveBeenCalledWith(policyId, updateDto)
      expect(result).toEqual(expectedResult)
    })
  })

  describe("remove", () => {
    it("should remove a policy", async () => {
      const policyId = "123e4567-e89b-12d3-a456-426614174000"

      mockPolicyService.remove.mockResolvedValue(undefined)

      await controller.remove(policyId)

      expect(service.remove).toHaveBeenCalledWith(policyId)
    })

    it("should handle removal errors", async () => {
      const policyId = "123e4567-e89b-12d3-a456-426614174000"
      mockPolicyService.remove.mockRejectedValue(new BadRequestException("Cannot delete active policy"))

      await expect(controller.remove(policyId)).rejects.toThrow(BadRequestException)
    })
  })
})
