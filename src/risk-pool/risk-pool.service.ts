import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskPool } from './entities/risk-pool.entity';
import { CreateRiskPoolDto } from './dto/create-risk-pool.dto';
import { UpdateRiskPoolDto } from './dto/update-risk-pool.dto';


@Injectable()
export class RiskPoolService {
  constructor(
    @InjectRepository(RiskPool)
    private readonly riskPoolRepository: Repository<RiskPool>,
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
}