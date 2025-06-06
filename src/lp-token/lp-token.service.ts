import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LPToken } from './lp-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { MintLpTokenDto } from './dtos/mint-lp-token.dto';
import { BurnLpTokenDto } from './dtos/burn-lp-token.dto';

@Injectable()
export class LpTokenService {
  constructor(
    @InjectRepository(LPToken)
    private readonly lpTokenRepo: Repository<LPToken>
  ) {}

  async mint(userId: number, dto: MintLpTokenDto) {
    const token = this.lpTokenRepo.create({
      userId,
      poolId: dto.poolId,
      amount: dto.amount,
      tokenId: uuidv4(),
    });

    return this.lpTokenRepo.save(token);
  }

  async burn(userId: number, dto: BurnLpTokenDto) {
    const token = await this.lpTokenRepo.findOne({ where: { tokenId: dto.tokenId } });

    if (!token) throw new NotFoundException('Token not found');
    if (token.userId !== userId) throw new ForbiddenException('Unauthorized');
    if (token.amount < dto.amount)
      throw new ForbiddenException('Insufficient balance');

    token.amount -= dto.amount;

    if (token.amount === 0) {
      await this.lpTokenRepo.remove(token);
      return { message: 'Token fully burned and removed' };
    } else {
      return this.lpTokenRepo.save(token);
    }
  }

  async findByUser(userId: number) {
    return this.lpTokenRepo.find({ where: { userId } });
  }
}