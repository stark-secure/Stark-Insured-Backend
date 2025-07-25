import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type LPTokenEventType = 'mint' | 'burn';

@Entity()
export class LPTokenEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Index()
  userAddress: string;

  @Column('decimal', { precision: 18, scale: 8 })
  amount: number;

  @Column({ type: 'varchar' })
  eventType: LPTokenEventType;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'varchar', nullable: true })
  transactionReference: string;
} 