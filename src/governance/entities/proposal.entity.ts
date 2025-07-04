import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsString, IsEnum, IsDate, IsOptional, Length, MinLength, IsInt, Min, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum ProposalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PASSED = 'passed',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @Length(10, 100, { message: 'Title must be between 10 and 100 characters' })
  title: string;

  @Column({ type: 'text' })
  @IsString()
  @MinLength(50, { message: 'Description must be at least 50 characters long' })
  description: string;

  @Column({ type: 'enum', enum: ProposalStatus, default: ProposalStatus.DRAFT })
  @IsEnum(ProposalStatus)
  status: ProposalStatus;

  @Column({ type: 'timestamp' })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  @ValidateIf((o) => o.startDate)
  expiryDate: Date;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  voteCount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  createdBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Custom validation method
  validateDates(): boolean {
    if (this.startDate && this.expiryDate) {
      return this.startDate < this.expiryDate;
    }
    return true;
  }
}