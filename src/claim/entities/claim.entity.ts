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
export enum ClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

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
