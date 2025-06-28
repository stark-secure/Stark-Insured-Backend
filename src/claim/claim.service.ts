import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { ClaimResponseDto } from './dto/claim_response_dto';
import { OracleService } from 'src/oracle/oracle.service';

@Injectable()
export class ClaimService {
  logger: any;
  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,

    private readonly oracleService: OracleService,
  ) {}

  async create(
    createClaimDto: CreateClaimDto,
    userId: number,
  ): Promise<ClaimResponseDto> {
    const claim = this.claimRepository.create({
      ...createClaimDto,
      userId,
    });

    const savedClaim = await this.claimRepository.save(claim);
    return new ClaimResponseDto(savedClaim);
  }

  async findAllByUser(userId: number): Promise<ClaimResponseDto[]> {
    const claims = await this.claimRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return claims.map((claim) => new ClaimResponseDto(claim));
  }

  async findAll(): Promise<ClaimResponseDto[]> {
    const claims = await this.claimRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return claims.map((claim) => new ClaimResponseDto(claim));
  }

  async findOne(
    id: number,
    userId?: number,
    isAdmin = false,
  ): Promise<ClaimResponseDto> {
    const claim = await this.claimRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }

    // Check ownership if not admin
    if (!isAdmin && claim.userId !== userId) {
      throw new ForbiddenException('You can only access your own claims');
    }

    return new ClaimResponseDto(claim);
  }

  async update(
    id: number,
    updateClaimDto: UpdateClaimDto,
    userId?: number,
    isAdmin = false,
  ): Promise<ClaimResponseDto> {
    const claim = await this.claimRepository.findOne({ where: { id } });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }

    // Only admins can update claims
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can update claims');
    }

    // Update the claim
    Object.assign(claim, updateClaimDto);
    const updatedClaim = await this.claimRepository.save(claim);

    return new ClaimResponseDto(updatedClaim);
  }

  async remove(id: number, userId?: number, isAdmin = false): Promise<void> {
    const claim = await this.claimRepository.findOne({ where: { id } });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }

    // Check ownership if not admin
    if (!isAdmin && claim.userId !== userId) {
      throw new ForbiddenException('You can only delete your own claims');
    }

    await this.claimRepository.remove(claim);
  }

  async getClaimStats(): Promise<any> {
    const [total, pending, approved, rejected] = await Promise.all([
      this.claimRepository.count(),
      this.claimRepository.count({ where: { status: ClaimStatus.PENDING } }),
      this.claimRepository.count({ where: { status: ClaimStatus.APPROVED } }),
      this.claimRepository.count({ where: { status: ClaimStatus.REJECTED } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }

  public async processClaim(claimId: number) {
    const claim = await this.claimRepository.findOne({ where: { id: claimId } });

    if (!claim || claim.status !== 'PENDING')
      throw new NotFoundException('Claim not found or already processed');

    try {
      const verdict = await this.oracleService.verifyClaim(
        claim.id,
        claim.description,
      );

      // Map string verdict to ClaimStatus enum
      claim.status =
        verdict === 'approved'
          ? ClaimStatus.APPROVED
          : verdict === 'rejected'
          ? ClaimStatus.REJECTED
          : ClaimStatus.PENDING;
      claim.oracleData = { verifiedAt: new Date(), verdict };
      await this.claimRepository.save(claim);
    } catch (e) {
      this.logger.warn(`Claim ${claimId} verification deferred: ${e.message}`);
    }
  }
}
