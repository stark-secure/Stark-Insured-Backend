import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskPool } from './entities/risk-pool.entity';
import { CreateRiskPoolDto } from './dto/create-risk-pool.dto';
import { UpdateRiskPoolDto } from './dto/update-risk-pool.dto';
import { RiskPoolRebalanceLog } from './entities/risk-pool-rebalance-log.entity';


@Injectable()
export class RiskPoolService {
  constructor(
    @InjectRepository(RiskPool)
    private readonly riskPoolRepository: Repository<RiskPool>,
    @InjectRepository(RiskPoolRebalanceLog)
    private readonly rebalanceLogRepository: Repository<RiskPoolRebalanceLog>,
  ) {}

  async create(createRiskPoolDto: CreateRiskPoolDto): Promise<RiskPool> {
    const riskPool = this.riskPoolRepository.create({
      ...createRiskPoolDto,
      totalLiquidity: 0, // Cannot be set manually
    });
    return this.riskPoolRepository.save(riskPool);
  }

  findAll(): Promise<RiskPool[]> {
    return this.riskPoolRepository.find();
  }

  async findOne(id: number): Promise<RiskPool> {
    const pool = await this.riskPoolRepository.findOne({ where: { id } });
    if (!pool) throw new NotFoundException('Risk pool not found');
    return pool;
  }

  async update(id: number, updateRiskPoolDto: UpdateRiskPoolDto): Promise<RiskPool> {
    if ('totalLiquidity' in updateRiskPoolDto) {
      throw new ForbiddenException('totalLiquidity cannot be manually edited');
    }
    const pool = await this.findOne(id);
    Object.assign(pool, updateRiskPoolDto);
    return this.riskPoolRepository.save(pool);
  }

  // Placeholder for liquidity logic (deposits/claims)
  async adjustLiquidity(id: number, amount: number): Promise<RiskPool> {
    // TODO: Implement deposit/claim logic and LP token minting
    const pool = await this.findOne(id);
    pool.totalLiquidity += amount;
    return this.riskPoolRepository.save(pool);
  }

  async getMetrics(id: number) {
    const pool = await this.findOne(id);
    const utilization = pool.totalLiquidity > 0 ? pool.activeCoverage / pool.totalLiquidity : 0;
    return {
      utilization,
      claimCount: pool.claimCount,
      payoutVolume: pool.payoutVolume,
      totalLiquidity: pool.totalLiquidity,
      activeCoverage: pool.activeCoverage,
      apy: pool.apy,
      utilizationHistory: pool.utilizationHistory || [],
    };
  }

  async autoRebalance(id: number, upperThreshold = 0.9, lowerThreshold = 0.2) {
    const pool = await this.findOne(id);
    const utilization = pool.totalLiquidity > 0 ? pool.activeCoverage / pool.totalLiquidity : 0;
    if (utilization > upperThreshold || utilization < lowerThreshold) {
      // Example: shift liquidity, adjust allocations, etc.
      // ...rebalance logic here...
      await this.logRebalance(id, 'auto', { utilization });
      return { rebalanced: true, utilization };
    }
    return { rebalanced: false, utilization };
  }

  async manualRebalance(id: number, details: any) {
    // ...manual rebalance logic here...
    await this.logRebalance(id, 'manual', details);
    return { rebalanced: true };
  }

  async logRebalance(poolId: number, type: 'auto' | 'manual', details: any) {
    const log = this.rebalanceLogRepository.create({ poolId, type, details });
    await this.rebalanceLogRepository.save(log);
  }

  async getRebalanceLogs(poolId: number) {
    return this.rebalanceLogRepository.find({ where: { poolId }, order: { createdAt: 'DESC' } });
  }
}