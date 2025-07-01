import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Proposal } from './proposal.entity';
import { User } from 'src/user/entities/user.entity';

@Entity('votes')
@Unique(['proposal', 'voter'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Proposal, (proposal) => proposal.votes)
  proposal: Proposal;

  @ManyToOne(() => User)
  voter: User;

  @Column({ length: 50 })
  option: string; // 'yes', 'no', 'abstain', etc.

  @CreateDateColumn()
  createdAt: Date;
}
