import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

export enum AssetType {
  CRYPTOCURRENCY = "cryptocurrency",
  NFT = "nft",
  TOKEN = "token",
}

export enum PolicyStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING = "pending",
}

export interface CoveredAsset {
  id: string
  symbol: string
  name: string
  assetType: AssetType
  contractAddress?: string
  tokenId?: string
  coverageLimit: number
  currentValue: number
  metadata?: Record<string, any>
}

@Entity("policies")
@Index(["userId", "status"])
@Index(["expiryDate"])
export class Policy {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "uuid" })
  userId: string

  @Column({ type: "varchar", length: 255 })
  policyNumber: string

  @Column({ type: "jsonb" })
  coveredAssets: CoveredAsset[]

  @Column({ type: "decimal", precision: 18, scale: 8 })
  totalCoverageLimit: number

  @Column({ type: "decimal", precision: 18, scale: 8 })
  totalPremium: number

  @Column({ type: "decimal", precision: 18, scale: 8 })
  totalCurrentValue: number

  @Column({
    type: "enum",
    enum: PolicyStatus,
    default: PolicyStatus.PENDING,
  })
  status: PolicyStatus

  @Column({ type: "timestamp" })
  startDate: Date

  @Column({ type: "timestamp" })
  expiryDate: Date

  @Column({ type: "jsonb", nullable: true })
  terms: Record<string, any>

  @Column({ type: "text", nullable: true })
  description: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Computed properties
  get isActive(): boolean {
    return this.status === PolicyStatus.ACTIVE && new Date() < this.expiryDate
  }

  get daysUntilExpiry(): number {
    const now = new Date()
    const expiry = new Date(this.expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}
