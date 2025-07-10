import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ClaimStatus } from '../enums/claim-status.enum';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  type: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.PENDING,
  })
  status: ClaimStatus;

  @Column({ type: 'jsonb', nullable: true })
  oracleData?: any;

  @Column({ type: 'boolean', default: false })
  oracleVerified: boolean;

  @Column({ type: 'boolean', default: false })
  fraudCheckCompleted: boolean;

  @Column({ type: 'boolean', nullable: true })
  isFraudulent?: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  fraudConfidenceScore?: number;

  @Column({ type: 'jsonb', nullable: true })
  fraudDetectionData?: {
    reason?: string;
    riskFactors?: string[];
    modelVersion?: string;
    detectedAt?: Date;
    metadata?: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.claims, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
