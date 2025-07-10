import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class RiskPoolRebalanceLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  poolId: number;

  @Column()
  type: 'auto' | 'manual';

  @Column({ type: 'simple-json', nullable: true })
  details?: any;

  @CreateDateColumn()
  createdAt: Date;
}
