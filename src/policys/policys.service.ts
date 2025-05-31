import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { Policy, PolicyStatus } from './entities/policy.entity';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
  ) {}

  async create(
    createPolicyDto: CreatePolicyDto,
    userId: number,
  ): Promise<Policy> {
    // Validate date range
    if (createPolicyDto.startDate >= createPolicyDto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate start date is not in the past (optional business rule)
    const now = new Date();
    if (createPolicyDto.startDate < now) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    const policy = this.policyRepository.create({
      ...createPolicyDto,
      userId,
    });

    return this.policyRepository.save(policy);
  }

  async getPoliciesForUser(userId: number): Promise<Policy[]> {
    return this.policyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId?: number): Promise<Policy> {
    const policy = await this.policyRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // If userId is provided, check ownership
    if (userId && policy.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return policy;
  }

  async update(
    id: number,
    updatePolicyDto: UpdatePolicyDto,
    userId: number,
    isAdmin = false,
  ): Promise<Policy> {
    const policy = await this.findOne(id);

    // Check ownership unless admin
    if (!isAdmin && policy.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Validate business rules for status changes
    if (updatePolicyDto.status) {
      this.validateStatusTransition(policy.status, updatePolicyDto.status);
    }

    // Validate date changes if provided
    if (updatePolicyDto.startDate || updatePolicyDto.endDate) {
      const startDate = updatePolicyDto.startDate || policy.startDate;
      const endDate = updatePolicyDto.endDate || policy.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Update the policy
    Object.assign(policy, updatePolicyDto);
    return this.policyRepository.save(policy);
  }

  async cancel(id: number, userId: number, isAdmin = false): Promise<Policy> {
    const policy = await this.findOne(id);

    // Check ownership unless admin
    if (!isAdmin && policy.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Can only cancel active policies
    if (policy.status !== PolicyStatus.ACTIVE) {
      throw new BadRequestException('Only active policies can be cancelled');
    }

    policy.status = PolicyStatus.CANCELLED;
    return this.policyRepository.save(policy);
  }

  async findAll(): Promise<Policy[]> {
    return this.policyRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  private validateStatusTransition(
    currentStatus: PolicyStatus,
    newStatus: PolicyStatus,
  ): void {
    const validTransitions: Record<PolicyStatus, PolicyStatus[]> = {
      [PolicyStatus.ACTIVE]: [PolicyStatus.CANCELLED, PolicyStatus.EXPIRED],
      [PolicyStatus.CANCELLED]: [], // Cannot transition from cancelled
      [PolicyStatus.EXPIRED]: [], // Cannot transition from expired
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  // Additional utility methods
  async getActivePoliciesForUser(userId: number): Promise<Policy[]> {
    return this.policyRepository.find({
      where: { userId, status: PolicyStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async getTotalCoverageForUser(userId: number): Promise<number> {
    const result = await this.policyRepository
      .createQueryBuilder('policy')
      .select('SUM(policy.coverageAmount)', 'total')
      .where('policy.userId = :userId', { userId })
      .andWhere('policy.status = :status', { status: PolicyStatus.ACTIVE })
      .getRawOne<{ total: string | null }>();

    return result && result.total ? parseFloat(result.total) : 0;
  }
}
