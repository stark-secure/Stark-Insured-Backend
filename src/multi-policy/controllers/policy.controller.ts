import { Controller, Get, Post, Patch, Param, Delete, HttpStatus, ParseUUIDPipe } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger"
import type { PolicyService } from "../services/policy.service"
import type { CreatePolicyDto } from "../dto/create-policy.dto"
import type { UpdatePolicyDto } from "../dto/update-policy.dto"
import type { QueryPolicyDto } from "../dto/query-policy.dto"
import { PolicyResponseDto } from "../dto/policy-response.dto"

@ApiTags("Policies")
@Controller("policy")
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new multi-asset policy",
    description:
      "Creates a new insurance policy that can cover multiple asset types including cryptocurrencies, NFTs, and tokens.",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Policy created successfully",
    type: PolicyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
    schema: {
      example: {
        statusCode: 400,
        message: ["Start date must be before expiry date"],
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Duplicate assets detected",
    schema: {
      example: {
        statusCode: 409,
        message: "Duplicate asset detected: ETH",
        error: "Conflict",
      },
    },
  })
  async create(createPolicyDto: CreatePolicyDto) {
    return await this.policyService.create(createPolicyDto)
  }

  @Get()
  @ApiOperation({
    summary: "Get all policies with filtering and pagination",
    description:
      "Retrieves a paginated list of policies with optional filtering by user, status, asset type, and expiry dates.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Policies retrieved successfully",
    schema: {
      example: {
        policies: [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            userId: "123e4567-e89b-12d3-a456-426614174001",
            policyNumber: "POL-2024-000001",
            coveredAssets: [
              {
                id: "eth-ethereum",
                symbol: "ETH",
                name: "Ethereum",
                assetType: "cryptocurrency",
                coverageLimit: 10000,
                currentValue: 8500,
                metadata: {},
              },
            ],
            totalCoverageLimit: 10000,
            totalPremium: 425,
            totalCurrentValue: 8500,
            status: "active",
            startDate: "2024-01-01T00:00:00Z",
            expiryDate: "2024-12-31T23:59:59Z",
            isActive: true,
            daysUntilExpiry: 180,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    },
  })
  async findAll(queryDto: QueryPolicyDto) {
    return await this.policyService.findAll(queryDto)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific policy by ID',
    description: 'Retrieves detailed information about a specific policy including all covered assets.',
  })
  @ApiParam({
    name: 'id',
    description: 'Policy UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Policy retrieved successfully',
    type: PolicyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Policy not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Policy with ID 123e4567-e89b-12d3-a456-426614174000 not found',
        error: 'Not Found',
      },
    },
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.policyService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a policy",
    description: "Updates an existing policy. Can modify covered assets, dates, status, and other policy details.",
  })
  @ApiParam({
    name: "id",
    description: "Policy UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Policy updated successfully",
    type: PolicyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Policy not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid update data",
  })
  async update(@Param('id', ParseUUIDPipe) id: string, updatePolicyDto: UpdatePolicyDto) {
    return await this.policyService.update(id, updatePolicyDto)
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a policy',
    description: 'Deletes a policy. Only non-active policies can be deleted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Policy UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Policy deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Policy not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete an active policy',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.policyService.remove(id);
  }
}
