import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LPToken } from './lp-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { MintLpTokenDto } from './dtos/mint-lp-token.dto';
import { BurnLpTokenDto } from './dtos/burn-lp-token.dto';
import { LPTokenEvent } from './lp-token-event.entity';
import { LpTokenEventQueryDto } from './dtos/lp-token-event-query.dto';
import { PaginatedLpTokenEventResponseDto } from './dtos/paginated-lp-token-event-response.dto';
import { LpTokenEventResponseDto } from './dtos/lp-token-event-response.dto';

@Injectable()
export class LpTokenService {
  constructor(
    @InjectRepository(LPToken)
    private readonly lpTokenRepo: Repository<LPToken>,
    @InjectRepository(LPTokenEvent)
    private readonly lpTokenEventRepo: Repository<LPTokenEvent>,
  ) {}

  async mint(userId: string, dto: MintLpTokenDto) {
    const token = this.lpTokenRepo.create({
      userId,
      poolId: dto.poolId,
      amount: dto.amount,
      tokenId: uuidv4(),
    });

    const savedToken = await this.lpTokenRepo.save(token);

    // Emit mint event
    const event = this.lpTokenEventRepo.create({
      userAddress: userId,
      amount: dto.amount,
      eventType: 'mint',
      transactionReference: savedToken.tokenId,
    });
    await this.lpTokenEventRepo.save(event);

    return savedToken;
  }

  async burn(userId: string, dto: BurnLpTokenDto) {
    const token = await this.lpTokenRepo.findOne({ where: { tokenId: dto.tokenId } });

    if (!token) throw new NotFoundException('Token not found');
    if (token.userId !== userId) throw new ForbiddenException('Unauthorized');
    if (token.amount < dto.amount)
      throw new ForbiddenException('Insufficient balance');

    token.amount -= dto.amount;

    let result;
    if (token.amount === 0) {
      await this.lpTokenRepo.remove(token);
      result = { message: 'Token fully burned and removed' };
    } else {
      result = await this.lpTokenRepo.save(token);
    }

    // Emit burn event
    const event = this.lpTokenEventRepo.create({
      userAddress: userId,
      amount: dto.amount,
      eventType: 'burn',
      transactionReference: dto.tokenId,
    });
    await this.lpTokenEventRepo.save(event);

    return result;
  }

  async findByUser(userId: string) {
    return this.lpTokenRepo.find({ where: { userId } });
  }

  async getEvents(query: LpTokenEventQueryDto): Promise<PaginatedLpTokenEventResponseDto> {
    const { eventType, userAddress, fromDate, toDate, page = 1, limit = 20 } = query;
    const qb = this.lpTokenEventRepo.createQueryBuilder('event');

    if (eventType) qb.andWhere('event.eventType = :eventType', { eventType });
    if (userAddress) qb.andWhere('event.userAddress = :userAddress', { userAddress });
    if (fromDate) qb.andWhere('event.timestamp >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('event.timestamp <= :toDate', { toDate });

    qb.orderBy('event.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map(e => ({
        id: e.id,
        userAddress: e.userAddress,
        amount: Number(e.amount),
        eventType: e.eventType,
        timestamp: e.timestamp,
        transactionReference: e.transactionReference,
      })),
      total,
      page,
      limit,
    };
  }
}