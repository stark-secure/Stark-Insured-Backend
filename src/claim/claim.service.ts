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
import { OracleService } from 'src/oracle/oracle.service';
import { FraudDetectionService } from '../fraud-detection/interfaces/fraud-detection.interface';

@Injectable()
export class ClaimService {
  private readonly logger = new Logger(ClaimService.name);

  constructor(
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
    private readonly oracleService: OracleService,
    private readonly fraudDetectionService: FraudDetectionService,
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
    
    // Run fraud detection asynchronously after claim creation
    this.runFraudDetectionAsync(savedClaim.id);

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
    const [total, pending, approved, rejected, flagged, fraudulent] = await Promise.all([
      this.claimRepository.count(),
      this.claimRepository.count({ where: { status: ClaimStatus.PENDING } }),
      this.claimRepository.count({ where: { status: ClaimStatus.APPROVED } }),
      this.claimRepository.count({ where: { status: ClaimStatus.REJECTED } }),
      this.claimRepository.count({ where: { status: ClaimStatus.FLAGGED } }),
      this.claimRepository.count({ where: { isFraudulent: true } }),
    ]);

    const fraudCheckCompleted = await this.claimRepository.count({ 
      where: { fraudCheckCompleted: true } 
    });

    return {
      total,
      pending,
      approved,
      rejected,
      flagged,
      fraudulent,
      fraudCheckCompleted,
      fraudCheckPending: total - fraudCheckCompleted,
    };
  }

  public async processClaim(claimId: number) {
    const claim = await this.claimRepository.findOne({ where: { id: claimId } });

    if (!claim || claim.status !== 'PENDING')
      throw new NotFoundException('Claim not found or already processed');

    try {
      // Run fraud detection first
      if (!claim.fraudCheckCompleted) {
        await this.runFraudDetection(claimId);
        // Reload claim to get updated fraud data
        const updatedClaim = await this.claimRepository.findOne({ 
          where: { id: claimId } 
        });
        if (updatedClaim) {
          Object.assign(claim, updatedClaim);
        }
      }

      // If claim is flagged as fraudulent, don't proceed with oracle verification
      if (claim.isFraudulent) {
        this.logger.warn(`Claim ${claimId} flagged as fraudulent, skipping oracle verification`);
        return;
      }

      // Proceed with oracle verification
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

  /**
   * Run fraud detection on a specific claim
   */
  public async runFraudDetection(claimId: number): Promise<void> {
    const claim = await this.claimRepository.findOne({ where: { id: claimId } });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    if (claim.fraudCheckCompleted) {
      this.logger.warn(`Fraud detection already completed for claim ${claimId}`);
      return;
    }

    try {
      this.logger.log(`Starting fraud detection for claim ${claimId}`);
      
      const fraudResult = await this.fraudDetectionService.detectFraud(claim);
      
      // Update claim with fraud detection results
      claim.fraudCheckCompleted = true;
      claim.isFraudulent = fraudResult.isFraudulent;
      claim.fraudConfidenceScore = fraudResult.confidenceScore;
      claim.fraudDetectionData = {
        reason: fraudResult.reason,
        riskFactors: fraudResult.metadata?.riskFactors,
        modelVersion: fraudResult.metadata?.modelVersion,
        detectedAt: fraudResult.metadata?.timestamp || new Date(),
        metadata: fraudResult.metadata,
      };

      // Flag claim if fraudulent
      if (fraudResult.isFraudulent) {
        claim.status = ClaimStatus.FLAGGED;
        this.logger.warn(
          `Claim ${claimId} flagged as fraudulent (confidence: ${fraudResult.confidenceScore.toFixed(2)})`
        );
      }

      await this.claimRepository.save(claim);
      
      this.logger.log(
        `Fraud detection completed for claim ${claimId}: ${
          fraudResult.isFraudulent ? 'FRAUDULENT' : 'LEGITIMATE'
        }`
      );
    } catch (error) {
      this.logger.error(
        `Fraud detection failed for claim ${claimId}: ${error.message}`,
        error.stack
      );
      
      // Mark fraud check as completed even if it failed to avoid infinite retries
      claim.fraudCheckCompleted = true;
      await this.claimRepository.save(claim);
      
      throw error;
    }
  }

  /**
   * Run fraud detection asynchronously (fire and forget)
   */
  private runFraudDetectionAsync(claimId: number): void {
    // Use setTimeout to run fraud detection asynchronously
    setTimeout(async () => {
      try {
        await this.runFraudDetection(claimId);
      } catch (error) {
        // Error is already logged in runFraudDetection
      }
    }, 0);
  }

  /**
   * Get fraud detection service status
   */
  async getFraudDetectionStatus(): Promise<{ healthy: boolean; message?: string }> {
    try {
      if (this.fraudDetectionService.getServiceStatus) {
        return await this.fraudDetectionService.getServiceStatus();
      }
      return { healthy: true, message: 'Service status check not implemented' };
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }
}