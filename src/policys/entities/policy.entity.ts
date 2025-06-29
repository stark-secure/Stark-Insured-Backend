import { User } from '../../user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

export enum PolicyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  coverageAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  premium: number;

  @Column({
    type: 'enum',
    enum: PolicyStatus,
    default: PolicyStatus.ACTIVE,
  })
  status: PolicyStatus;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.policies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
