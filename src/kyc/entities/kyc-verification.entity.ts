import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DocumentType, KycStatus } from '../dto/kyc-verification.dto';
import { User } from 'src/user/entities/user.entity';

@Entity('kyc_verifications')
@Index(['userId', 'status'])
@Index(['verificationId'], { unique: true })
export class KycVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  verificationId: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.kycVerifications, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  fullName: string;

  @Column({ type: 'date' })
  dob: string;

  @Column()
  nationalId: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column('text')
  documentImageHash: string; // Store hash instead of actual image for security

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  status: KycStatus;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ type: 'int', default: 30 })
  estimatedProcessingTime: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  providerResponse?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
