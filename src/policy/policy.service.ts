/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './policy.entity';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
  ) {}

  async findById(id: number): Promise<Policy> {
    const policy = await this.policyRepo.findOneBy({ id });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  async update(policy: Policy): Promise<Policy> {
    return this.policyRepo.save(policy);
  }
}
