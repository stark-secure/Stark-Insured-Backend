import { Controller, Get, Post, Param, HttpCode, HttpStatus, Logger, NotFoundException } from "@nestjs/common"
import type { PolicyComparisonService } from "./policy-comparison.service"
import type { PolicyDto, ComparePoliciesDto, PolicyComparisonResultDto } from "./dtos/policy-comparison.dto"

@Controller("policies")
export class PolicyComparisonController {
  private readonly logger = new Logger(PolicyComparisonController.name)

  constructor(private readonly policyComparisonService: PolicyComparisonService) {}

  /**
   * Get all available policies.
   * @returns A list of all policies.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllPolicies(): Promise<PolicyDto[]> {
    this.logger.log("Received request to get all policies.")
    const policies = await this.policyComparisonService.getAllPolicies()
    return policies
  }

  /**
   * Compare multiple policies side-by-side.
   * @param body DTO containing an array of policy IDs to compare.
   * @returns A structured comparison result.
   */
  @Post("compare")
  @HttpCode(HttpStatus.OK)
  async comparePolicies(body: ComparePoliciesDto): Promise<PolicyComparisonResultDto> {
    this.logger.log(`Received comparison request for policy IDs: ${body.policyIds.join(", ")}`)
    const comparisonResult = await this.policyComparisonService.comparePolicies(body.policyIds)
    return comparisonResult
  }

  /**
   * Get a single policy by ID.
   * @param id The ID of the policy.
   * @returns The policy details.
   */
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getPolicyById(@Param("id") id: string): Promise<PolicyDto> {
    this.logger.log(`Received request to get policy by ID: ${id}`)
    const policies = await this.policyComparisonService.getPoliciesByIds([id])
    if (policies.length === 0) {
      throw new NotFoundException(`Policy with ID ${id} not found.`)
    }
    return policies[0]
  }
}
