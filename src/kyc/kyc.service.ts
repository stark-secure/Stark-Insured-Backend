// src/user/services/kyc.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User } from '../user/entities/user.entity';
import {
  KycVerificationRequestDto,
  KycVerificationResponseDto,
  KycStatus,
  DocumentType,
} from './dto/kyc-verification.dto';
import { KycVerification } from './entities/kyc-verification.entity';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycVerification)
    private kycRepository: Repository<KycVerification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async verifyKyc(
    userId: string,
    kycData: KycVerificationRequestDto,
  ): Promise<KycVerificationResponseDto> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a pending or approved KYC
    const existingKyc = await this.kycRepository.findOne({
      where: {
        userId,
        status: KycStatus.APPROVED,
      },
    });

    if (existingKyc) {
      throw new BadRequestException(
        'User already has an approved KYC verification',
      );
    }

    // Generate unique verification ID
    const verificationId = this.generateVerificationId();

    // Hash the document image for storage (security best practice)
    const documentImageHash = this.hashDocumentImage(kycData.documentImage);

    // Create KYC verification record
    const kycVerification = this.kycRepository.create({
      verificationId,
      userId,
      fullName: kycData.fullName,
      dob: kycData.dob,
      nationalId: kycData.nationalId,
      documentType: kycData.documentType,
      documentImageHash,
      status: KycStatus.PENDING,
      estimatedProcessingTime: this.calculateProcessingTime(
        kycData.documentType,
      ),
      metadata: {
        provider: 'mock-kyc-provider',
        version: '1.0.0',
        submissionMethod: 'api',
        ipAddress: 'masked', // In real implementation, you'd get this from request
      },
    });

    await this.kycRepository.save(kycVerification);

    // Simulate external KYC provider processing
    const mockResult = await this.simulateKycVerification(kycData);

    // Update verification with mock result
    kycVerification.status = mockResult.status;
    kycVerification.rejectionReason = mockResult.rejectionReason;
    kycVerification.providerResponse = mockResult.providerResponse;

    if (mockResult.status !== KycStatus.PENDING) {
      kycVerification.completedAt = new Date();
    }

    await this.kycRepository.save(kycVerification);

    this.logger.log(
      `KYC verification initiated for user ${userId} with ID ${verificationId}`,
    );

    return this.mapToResponseDto(kycVerification);
  }

  async getKycStatus(
    userId: string,
    verificationId: string,
  ): Promise<KycVerificationResponseDto> {
    const kycVerification = await this.kycRepository.findOne({
      where: { userId, verificationId },
    });

    if (!kycVerification) {
      throw new NotFoundException('KYC verification not found');
    }

    return this.mapToResponseDto(kycVerification);
  }

  async getUserKycVerifications(
    userId: string,
  ): Promise<KycVerificationResponseDto[]> {
    const verifications = await this.kycRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return verifications.map((verification) =>
      this.mapToResponseDto(verification),
    );
  }

  private generateVerificationId(): string {
    return `kyc_${crypto.randomUUID()}`;
  }

  private hashDocumentImage(base64Image: string): string {
    // Remove data URL prefix if present
    const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    return crypto.createHash('sha256').update(imageData).digest('hex');
  }

  private calculateProcessingTime(documentType: DocumentType): number {
    // Simulate different processing times based on document type
    const processingTimes = {
      [DocumentType.PASSPORT]: 45,
      [DocumentType.NATIONAL_ID]: 30,
      [DocumentType.DRIVERS_LICENSE]: 60,
    };

    return processingTimes[documentType];
  }

  private async simulateKycVerification(
    kycData: KycVerificationRequestDto,
  ): Promise<{
    status: KycStatus;
    rejectionReason?: string;
    providerResponse: Record<string, any>;
  }> {
    // Use simulateResult flag if provided (for testing)
    if (kycData.simulateResult) {
      const status = kycData.simulateResult;
      return {
        status,
        rejectionReason:
          status === KycStatus.REJECTED
            ? 'Simulated rejection for testing'
            : undefined,
        providerResponse: {
          providerId: 'mock-provider-12345',
          confidence: status === KycStatus.APPROVED ? 0.95 : 0.45,
          checksPerformed: [
            'document_authenticity',
            'face_match',
            'data_validation',
          ],
          processingTime: Math.random() * 1000 + 500, // Random processing time
        },
      };
    }

    // Simulate realistic KYC logic
    const documentQuality = this.assessDocumentQuality(kycData.documentImage);
    const dataConsistency = this.checkDataConsistency(kycData);
    const riskScore = this.calculateRiskScore(kycData);

    let status: KycStatus;
    let rejectionReason: string | undefined;

    if (documentQuality < 0.7) {
      status = KycStatus.REJECTED;
      rejectionReason = 'Document quality too low';
    } else if (!dataConsistency) {
      status = KycStatus.REJECTED;
      rejectionReason = 'Data inconsistency detected';
    } else if (riskScore > 0.8) {
      status = KycStatus.REJECTED;
      rejectionReason = 'High risk profile detected';
    } else if (riskScore > 0.5 || documentQuality < 0.85) {
      status = KycStatus.PENDING; // Requires manual review
    } else {
      status = KycStatus.APPROVED;
    }

    // Simulate processing delay for pending status
    if (status === KycStatus.PENDING) {
      // In real implementation, this would trigger a background job
      this.logger.log('KYC verification requires manual review');
    }

    return {
      status,
      rejectionReason,
      providerResponse: {
        providerId: `mock-${Date.now()}`,
        confidence: documentQuality,
        riskScore,
        checksPerformed: [
          'document_authenticity',
          'face_match',
          'data_validation',
          'watchlist_screening',
        ],
        processingTime: Math.random() * 2000 + 1000,
        additionalInfo: {
          documentType: kycData.documentType,
          extractedData: {
            name: kycData.fullName,
            dob: kycData.dob,
            documentNumber: kycData.nationalId,
          },
        },
      },
    };
  }

  private assessDocumentQuality(base64Image: string): number {
    // Mock document quality assessment
    // In real implementation, this would use image processing algorithms
    const imageSize = base64Image.length;

    // Simulate quality based on image size (larger = better quality)
    if (imageSize < 10000) return 0.3; // Very poor quality
    if (imageSize < 50000) return 0.6; // Poor quality
    if (imageSize < 100000) return 0.8; // Good quality
    return 0.95; // Excellent quality
  }

  private checkDataConsistency(kycData: KycVerificationRequestDto): boolean {
    // Mock data consistency checks
    // In real implementation, this would validate against external databases

    // Simple validation: reject obvious test data
    const testPatterns = ['test', 'fake', '123456', 'sample'];
    const fullNameLower = kycData.fullName.toLowerCase();
    const nationalIdLower = kycData.nationalId.toLowerCase();

    return !testPatterns.some(
      (pattern) =>
        fullNameLower.includes(pattern) || nationalIdLower.includes(pattern),
    );
  }

  private calculateRiskScore(kycData: KycVerificationRequestDto): number {
    // Mock risk scoring
    // In real implementation, this would use ML models and external risk databases

    let riskScore = 0;

    // Age-based risk (very young or very old might be higher risk)
    const birthYear = new Date(kycData.dob).getFullYear();
    const age = new Date().getFullYear() - birthYear;
    if (age < 18 || age > 80) riskScore += 0.2;

    // Document type risk
    if (kycData.documentType === DocumentType.DRIVERS_LICENSE) {
      riskScore += 0.1; // Slightly higher risk
    }

    // Random component to simulate real-world variability
    riskScore += Math.random() * 0.3;

    return Math.min(riskScore, 1);
  }

  private mapToResponseDto(
    kycVerification: KycVerification,
  ): KycVerificationResponseDto {
    const expectedCompletionAt = new Date(kycVerification.createdAt);
    expectedCompletionAt.setMinutes(
      expectedCompletionAt.getMinutes() +
        kycVerification.estimatedProcessingTime,
    );

    return {
      verificationId: kycVerification.verificationId,
      status: kycVerification.status,
      rejectionReason: kycVerification.rejectionReason,
      estimatedProcessingTime: kycVerification.estimatedProcessingTime,
      submittedAt: kycVerification.createdAt.toISOString(),
      expectedCompletionAt: expectedCompletionAt.toISOString(),
      metadata: kycVerification.metadata || {},
    };
  }
}
