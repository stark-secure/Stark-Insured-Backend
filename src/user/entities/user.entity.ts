// src/user/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Policy } from 'src/policys/entities/policy.entity';
import { Claim } from 'src/claim/entities/claim.entity';
import { KycVerification } from 'src/kyc/entities/kyc-verification.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  @Exclude() // Don't return password in responses
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true, type: 'text' })
  @Exclude()
  refreshToken: string | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Policy, (policy) => policy.user)
  policies: Policy[];

  @OneToMany(() => Claim, (claim) => claim.user)
  claims: Claim[];

  @OneToMany(() => KycVerification, (kyc) => kyc.user)
  kycVerifications: KycVerification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to get the latest KYC verification
  get latestKycVerification(): KycVerification | undefined {
    if (!this.kycVerifications || this.kycVerifications.length === 0) {
      return undefined;
    }
    return this.kycVerifications.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
  }
}
