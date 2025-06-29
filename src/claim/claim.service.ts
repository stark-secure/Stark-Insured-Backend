import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { ClaimResponseDto } from './dto/claim_response_dto';
import { OracleService } from '../oracle/oracle.service';
import { ClaimNotificationService } from './notification.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ClaimService {
  private readonly logger = new Logger(ClaimService.name);

  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,

    private readonly oracleService: OracleService,
    private readonly notificationService: ClaimNotificationService,
    private readonly userService: UserService,
  ) {}

  async create(
    createClaimDto: CreateClaimDto,
    userId: string,
  ): Promise<ClaimResponseDto> {
    const claim = this.claimRepository.create({
      ...createClaimDto,
      userId,
    });

    const savedClaim = await this.claimRepository.save(claim);
    
    // Send notification for claim submission
    try {
      const user = await this.userService.findOne(userId);
      if (user) {
        await this.notificationService.sendClaimSubmittedNotification(savedClaim, user);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send claim submission notification for claim ${savedClaim.id}: ${error.message}`,
        {
          claimId: savedClaim.id,
          userId,
          error: error.message,
        },
      );
    }

    return new ClaimResponseDto(savedClaim);
  }

  async findAllByUser(userId: string): Promise<ClaimResponseDto[]> {
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
    userId?: string,
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
    userId?: string,
    isAdmin = false,
  ): Promise<ClaimResponseDto> {
    const claim = await this.claimRepository.findOne({ 
      where: { id },
      relations: ['user'],
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }

    // Only admins can update claims
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can update claims');
    }

    const previousStatus = claim.status;
    const previousUser = claim.user;

    // Update the claim
    Object.assign(claim, updateClaimDto);
    const updatedClaim = await this.claimRepository.save(claim);

    // Send notification for status change if status was updated
    if (updateClaimDto.status && previousStatus !== updateClaimDto.status) {
      try {
        await this.notificationService.sendClaimStatusNotification({
          claim: updatedClaim,
          user: previousUser,
          previousStatus,
          newStatus: updateClaimDto.status,
          remarks: updateClaimDto.description ? `Updated description: ${updateClaimDto.description}` : undefined,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send status change notification for claim ${updatedClaim.id}: ${error.message}`,
          {
            claimId: updatedClaim.id,
            userId: previousUser.id,
            previousStatus,
            newStatus: updateClaimDto.status,
            error: error.message,
          },
        );
      }
    }

    return new ClaimResponseDto(updatedClaim);
  }

  async remove(id: number, userId?: string, isAdmin = false): Promise<void> {
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
    const claim = await this.claimRepository.findOne({ 
      where: { id: claimId },
      relations: ['user'],
    });

    if (!claim || claim.status !== ClaimStatus.PENDING) {
      throw new NotFoundException('Claim not found or already processed');
    }

    try {
      const verdict = await this.oracleService.verifyClaim(
        claim.id,
        claim.description,
      );

      const previousStatus = claim.status;

      // Map string verdict to ClaimStatus enum
      claim.status =
        verdict === 'approved'
          ? ClaimStatus.APPROVED
          : verdict === 'rejected'
          ? ClaimStatus.REJECTED
          : ClaimStatus.PENDING;
      
      claim.oracleData = { verifiedAt: new Date(), verdict };
      const updatedClaim = await this.claimRepository.save(claim);

      // Send notification for oracle processing completion
      if (claim.user) {
        try {
          await this.notificationService.sendClaimProcessingNotification(
            updatedClaim,
            claim.user,
            verdict,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send processing notification for claim ${claimId}: ${error.message}`,
            {
              claimId,
              userId: claim.user.id,
              verdict,
              error: error.message,
            },
          );
        }
      }

      this.logger.log(
        `Claim ${claimId} processed successfully with verdict: ${verdict}`,
        {
          claimId,
          previousStatus,
          newStatus: claim.status,
          verdict,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process claim ${claimId}: ${error.message}`,
        {
          claimId,
          error: error.message,
          stack: error.stack,
        },
      );
      throw error;
    }
  }
}
