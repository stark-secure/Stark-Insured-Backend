import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class LPToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  poolId: number;

  @Column('decimal', { precision: 18, scale: 8 })
  amount: number;

  @CreateDateColumn()
  mintedAt: Date;

  @Column({ unique: true })
  tokenId: string;
}