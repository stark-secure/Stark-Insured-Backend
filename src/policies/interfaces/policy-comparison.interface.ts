/**
 * Represents a simplified policy structure for comparison.
 */
export interface PolicyDetails {
  id: string
  name: string
  provider: string
  premium: number
  policyType: string
  description?: string
  coverageDetails?: Record<string, any>
  benefits?: Record<string, any>
  exclusions?: string[]
}

/**
 * Represents a single feature row in the comparison table.
 */
export interface ComparisonFeature {
  name: string // e.g., "Premium", "Liability Coverage", "Dental Benefits"
  type: "currency" | "text" | "boolean" | "list" // Helps frontend render
  values: {
    [policyId: string]: any // Value for each policy being compared
  }
}

/**
 * The structured result of a policy comparison.
 */
export interface PolicyComparisonResult {
  policies: PolicyDetails[] // The full details of the policies being compared
  comparisonTable: ComparisonFeature[] // The features arranged for side-by-side comparison
}
