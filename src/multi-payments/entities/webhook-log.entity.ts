import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { WebhookStatus } from '../dto/webhook.dto';

@Entity('webhook_logs')
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id' })
  @Index()
  paymentId: string;

  @Column({ type: 'enum', enum: WebhookStatus })
  status: WebhookStatus;

  @Column()
  provider: string;

  @Column({ type: 'jsonb' })
  headers: Record<string, string>;

  @Column({ type: 'jsonb' })
  body: any;

  @Column({ name: 'processed_at' })
  processedAt: Date;

  @Column({ default: false })
  processed: boolean;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
} 