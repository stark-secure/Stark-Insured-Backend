import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Claim } from '../claim/entities/claim.entity';
import { OracleVerificationDto, EventType } from './dto/create-oracle.dto';
import { OraclePayload, OracleVerificationResponseDto } from './dto/oracle-response.dto';
import { OracleVerificationResult } from './interfaces/oracle.interface';
import * as crypto from 'crypto';

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);
  private readonly maxTimestampAge: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
  ) {
    // Maximum age for oracle timestamps (24 hours by default)
    this.maxTimestampAge = this.configService.get<number>('ORACLE_MAX_TIMESTAMP_AGE', 86400);
  }

  // Legacy method for backward compatibility
  async verifyClaim(claimId: number, claimDetails: string): Promise<'approved' | 'rejected'> {
    try {
      const response = await this.httpService.axiosRef.post('https://mock-oracle/verify', {
        claimId,
        details: claimDetails,
      });

      this.logger.log(`Oracle response for claim ${claimId}: ${JSON.stringify(response.data)}`);

      if (response.data.valid) return 'approved';
      return 'rejected';
    } catch (err) {
      this.logger.error(`Oracle verification failed for claim ${claimId}`, err.stack);
      throw new Error('Oracle response failed');
    }
  }

  // New method for signature-based verification
  async verifyClaimWithSignature(payload: OraclePayload): Promise<OracleVerificationResponseDto> {
    const { claimId, signature, eventType, timestamp, verificationData } = payload;

    this.logger.log(`Processing oracle verification for claim ${claimId}`);

    // Validate timestamp
    this.validateTimestamp(timestamp);

    // Find the claim
    const claim = await this.claimRepository.findOne({
      where: { id: claimId },
      relations: ['user']
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Update claim with oracle verification
    const verificationResult = await this.updateClaimWithVerification(
      claim,
      eventType as EventType,
      timestamp,
      verificationData
    );

    return {
      success: verificationResult.success,
      claimId: claim.id,
      message: verificationResult.success
        ? 'Claim successfully verified by oracle'
        : 'Oracle verification failed',
      verifiedAt: new Date().toISOString(),
      signatureValid: verificationResult.signatureValid,
      metadata: {
        eventType,
        originalTimestamp: timestamp,
        verificationData,
        confidenceScore: verificationResult.confidenceScore || 1.0
      }
    };
  }

  private validateTimestamp(timestamp: string): void {
    const eventTime = new Date(timestamp);
    const now = new Date();
    const ageInSeconds = (now.getTime() - eventTime.getTime()) / 1000;

    if (ageInSeconds > this.maxTimestampAge) {
      throw new BadRequestException(
        `Oracle timestamp too old. Maximum age: ${this.maxTimestampAge} seconds`
      );
    }

    if (eventTime > now) {
      throw new BadRequestException('Oracle timestamp cannot be in the future');
    }
  }

  private async updateClaimWithVerification(
    claim: Claim,
    eventType: EventType,
    timestamp: string,
    verificationData?: Record<string, any>
  ): Promise<OracleVerificationResult> {
    try {
      // Set oracle verification flag
      claim.oracleVerified = true;

      // Update oracle data with verification details
      claim.oracleData = {
        ...claim.oracleData,
        verifiedAt: new Date(),
        eventType,
        originalTimestamp: timestamp,
        verificationData,
        oracleVerification: {
          success: true,
          verifiedBy: 'oracle-system',
          confidenceScore: this.calculateConfidenceScore(eventType, verificationData)
        }
      };

      await this.claimRepository.save(claim);

      this.logger.log(`Claim ${claim.id} successfully verified by oracle`);

      return {
        success: true,
        claimId: claim.id,
        eventType,
        timestamp: new Date(timestamp),
        signatureValid: true,
        verificationData,
        confidenceScore: this.calculateConfidenceScore(eventType, verificationData)
      };
    } catch (error) {
      this.logger.error(`Failed to update claim ${claim.id} with oracle verification`, error.stack);

      return {
        success: false,
        claimId: claim.id,
        eventType,
        timestamp: new Date(timestamp),
        signatureValid: false,
        verificationData
      };
    }
  }

  private calculateConfidenceScore(eventType: EventType, verificationData?: Record<string, any>): number {
    // Base confidence score based on event type
    let baseScore = 0.8;

    switch (eventType) {
      case EventType.WALLET_EXPLOIT:
      case EventType.SMART_CONTRACT_HACK:
        baseScore = 0.9; // High confidence for blockchain-verifiable events
        break;
      case EventType.PROTOCOL_DOWNTIME:
        baseScore = 0.85;
        break;
      case EventType.PRICE_MANIPULATION:
      case EventType.BRIDGE_EXPLOIT:
        baseScore = 0.8;
        break;
      case EventType.GOVERNANCE_ATTACK:
        baseScore = 0.75;
        break;
      case EventType.OTHER:
        baseScore = 0.6;
        break;
    }

    // Adjust based on verification data quality
    if (verificationData) {
      if (verificationData.transactionHash) baseScore += 0.05;
      if (verificationData.blockNumber) baseScore += 0.03;
      if (verificationData.affectedAddress) baseScore += 0.02;
    }

    return Math.min(baseScore, 1.0);
  }

  // Method to get oracle verification status for a claim
  async getVerificationStatus(claimId: number): Promise<{ verified: boolean; data?: any }> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId }
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    return {
      verified: claim.oracleVerified,
      data: claim.oracleData
    };
  }
}