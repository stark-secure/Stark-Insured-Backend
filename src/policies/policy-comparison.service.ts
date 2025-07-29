import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common"
import { type Repository, In } from "typeorm"
import type { Policy } from "./entities/policy.entity"
import type { PolicyDetails, ComparisonFeature, PolicyComparisonResult } from "./interfaces/policy-comparison.interface"

@Injectable()
export class PolicyComparisonService {
  private readonly logger = new Logger(PolicyComparisonService.name)

  constructor(private policyRepository: Repository<Policy>) {}

  /**
   * Retrieves all available policies.
   * @returns A list of all policies.
   */
  async getAllPolicies(): Promise<PolicyDetails[]> {
    this.logger.log("Fetching all policies...")
    const policies = await this.policyRepository.find()
    return policies.map((p) => this.mapToPolicyDetails(p))
  }

  /**
   * Retrieves policies by their IDs.
   * @param policyIds An array of policy IDs.
   * @returns A list of policies matching the IDs.
   * @throws NotFoundException if any policy ID is not found.
   */
  async getPoliciesByIds(policyIds: string[]): Promise<Policy[]> {
    if (!policyIds || policyIds.length === 0) {
      throw new BadRequestException("Policy IDs cannot be empty.")
    }
    const policies = await this.policyRepository.findBy({ id: In(policyIds) })

    if (policies.length !== policyIds.length) {
      const foundIds = new Set(policies.map((p) => p.id))
      const missingIds = policyIds.filter((id) => !foundIds.has(id))
      throw new NotFoundException(`Policies with IDs ${missingIds.join(", ")} not found.`)
    }
    return policies
  }

  /**
   * Compares a list of policies based on their features.
   * @param policyIds An array of policy IDs to compare.
   * @returns A structured comparison result.
   * @throws BadRequestException if less than 2 policies are provided or policies are of different types.
   * @throws NotFoundException if any policy ID is not found.
   */
  async comparePolicies(policyIds: string[]): Promise<PolicyComparisonResult> {
    if (policyIds.length < 2 || policyIds.length > 3) {
      throw new BadRequestException("Please select 2 or 3 policies for comparison.")
    }

    this.logger.log(`Comparing policies: ${policyIds.join(", ")}`)
    const policies = await this.getPoliciesByIds(policyIds)

    // Ensure all policies are of the same type for meaningful comparison
    const firstPolicyType = policies[0].policyType
    if (!policies.every((p) => p.policyType === firstPolicyType)) {
      throw new BadRequestException("Only policies of the same type can be compared.")
    }

    const comparisonTable: ComparisonFeature[] = []
    const policyDetails: PolicyDetails[] = policies.map((p) => this.mapToPolicyDetails(p))

    // Add common features
    comparisonTable.push({
      name: "Policy Name",
      type: "text",
      values: this.getFeatureValues(policies, "name"),
    })
    comparisonTable.push({
      name: "Provider",
      type: "text",
      values: this.getFeatureValues(policies, "provider"),
    })
    comparisonTable.push({
      name: "Premium",
      type: "currency",
      values: this.getFeatureValues(policies, "premium"),
    })
    comparisonTable.push({
      name: "Description",
      type: "text",
      values: this.getFeatureValues(policies, "description"),
    })

    // Dynamically add coverage details
    this.extractAndAddJsonbFeatures(policies, "coverageDetails", comparisonTable)

    // Dynamically add benefits
    this.extractAndAddJsonbFeatures(policies, "benefits", comparisonTable)

    // Add exclusions
    comparisonTable.push({
      name: "Exclusions",
      type: "list",
      values: this.getFeatureValues(policies, "exclusions", (val) => (Array.isArray(val) ? val.join(", ") : val)),
    })

    this.logger.log(`Comparison generated for ${policies.length} policies.`)
    return { policies: policyDetails, comparisonTable }
  }

  /**
   * Helper to map Policy entity to PolicyDetails interface.
   */
  private mapToPolicyDetails(policy: Policy): PolicyDetails {
    return {
      id: policy.id,
      name: policy.name,
      provider: policy.provider,
      premium: policy.premium,
      policyType: policy.policyType,
      description: policy.description,
      coverageDetails: policy.coverageDetails,
      benefits: policy.benefits,
      exclusions: policy.exclusions,
    }
  }

  /**
   * Extracts values for a specific feature from multiple policies.
   */
  private getFeatureValues(
    policies: Policy[],
    featureKey: keyof Policy,
    formatter?: (value: any) => any,
  ): { [policyId: string]: any } {
    const values: { [policyId: string]: any } = {}
    for (const policy of policies) {
      let value = policy[featureKey]
      if (formatter) {
        value = formatter(value)
      }
      values[policy.id] = value !== undefined && value !== null ? value : "N/A"
    }
    return values
  }

  /**
   * Extracts and adds features from JSONB columns (coverageDetails, benefits) to the comparison table.
   */
  private extractAndAddJsonbFeatures(
    policies: Policy[],
    jsonbKey: "coverageDetails" | "benefits",
    comparisonTable: ComparisonFeature[],
  ): void {
    const allFeatureKeys = new Set<string>()
    policies.forEach((policy) => {
      if (policy[jsonbKey]) {
        Object.keys(policy[jsonbKey]).forEach((key) => allFeatureKeys.add(key))
      }
    })

    Array.from(allFeatureKeys)
      .sort()
      .forEach((featureKey) => {
        const feature: ComparisonFeature = {
          name: this.formatFeatureName(featureKey),
          type: this.determineFeatureType(featureKey, policies, jsonbKey),
          values: {},
        }

        for (const policy of policies) {
          const value = policy[jsonbKey]?.[featureKey]
          feature.values[policy.id] = value !== undefined && value !== null ? value : "N/A"
        }
        comparisonTable.push(feature)
      })
  }

  /**
   * Formats a feature key into a more readable name.
   */
  private formatFeatureName(key: string): string {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
  }

  /**
   * Tries to determine the type of a feature for frontend rendering hints.
   */
  private determineFeatureType(
    featureKey: string,
    policies: Policy[],
    jsonbKey: "coverageDetails" | "benefits",
  ): "currency" | "text" | "boolean" | "list" {
    // Check values across all policies to infer type
    for (const policy of policies) {
      const value = policy[jsonbKey]?.[featureKey]
      if (typeof value === "boolean") return "boolean"
      if (typeof value === "number" && featureKey.toLowerCase().includes("premium" || "amount" || "value"))
        return "currency"
      if (Array.isArray(value)) return "list"
    }
    return "text" // Default to text if no specific type is inferred
  }
}
