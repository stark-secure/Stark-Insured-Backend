import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class RiskPool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  token: string; // e.g., ETH, USDC

  @Column({ type: 'float', default: 0 })
  totalLiquidity: number;

  @Column({ type: 'float', default: 0 })
  activeCoverage: number;

  @Column({ type: 'float', nullable: true })
  apy?: number;

  @Column({ type: 'int', default: 0 })
  claimCount: number;

  @Column({ type: 'float', default: 0 })
  payoutVolume: number;

  @Column({ type: 'simple-json', nullable: true })
  utilizationHistory?: { timestamp: string; utilization: number }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}