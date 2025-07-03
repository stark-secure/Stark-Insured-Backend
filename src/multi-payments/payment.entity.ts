import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import { User } from "./user.entity"

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  CONFIRMED = "confirmed",
  FAILED = "failed",
  EXPIRED = "expired",
}

export enum PaymentType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  PREMIUM = "premium",
  REWARD = "reward",
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "user_id" })
  userId: string

  @Column({
    type: "enum",
    enum: PaymentType,
  })
  type: PaymentType

  @Column({ type: "decimal", precision: 18, scale: 8 })
  amount: number

  @Column()
  currency: string

  @Column({ name: "chain_name" })
  @Index()
  chainName: string

  @Column({ name: "chain_id" })
  chainId: string

  @Column({ name: "tx_hash", nullable: true })
  @Index()
  txHash: string

  @Column({ name: "block_number", nullable: true })
  blockNumber: string

  @Column({ name: "from_address", nullable: true })
  fromAddress: string

  @Column({ name: "to_address", nullable: true })
  toAddress: string

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status: PaymentStatus

  @Column({ name: "confirmation_count", default: 0 })
  confirmationCount: number

  @Column({ name: "required_confirmations", default: 12 })
  requiredConfirmations: number

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>

  @Column({ name: "expires_at", nullable: true })
  expiresAt: Date

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  @Column({ name: "confirmed_at", nullable: true })
  confirmedAt: Date

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User
}
