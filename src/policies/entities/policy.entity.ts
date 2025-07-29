import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("policies")
export class Policy {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  name: string // e.g., "Basic Car Insurance", "Premium Health Plan"

  @Column()
  provider: string // e.g., "Acme Insurance Co."

  @Column("decimal", { precision: 10, scale: 2 })
  premium: number // Monthly or annual premium

  @Column()
  policyType: string // e.g., "car", "health", "home"

  @Column("jsonb", { nullable: true })
  coverageDetails?: Record<string, any> // e.g., { "liability": "1M", "collision": "50k" }

  @Column("jsonb", { nullable: true })
  benefits?: Record<string, any> // e.g., { "roadsideAssistance": true, "dentalCoverage": false }

  @Column("jsonb", { nullable: true })
  exclusions?: string[] // e.g., ["pre-existing conditions", "off-road damage"]

  @Column({ nullable: true })
  description?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
