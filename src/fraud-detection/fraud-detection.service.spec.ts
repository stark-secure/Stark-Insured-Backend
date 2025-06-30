import { Test, TestingModule } from '@nestjs/testing';
import { MockFraudDetectionService } from './mock-fraud-detection.service';
import { Claim, ClaimStatus } from '../claim/entities/claim.entity';
import { FraudResult } from './fraud-detection.interface';

describe('MockFraudDetectionService', () => {
  let service: MockFraudDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockFraudDetectionService],
    }).compile();

    service = module.get<MockFraudDetectionService>(MockFraudDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectFraud', () => {
    let mockClaim: Claim;

    beforeEach(() => {
      mockClaim = {
        id: 1,
        type: 'auto',
        description: 'Car accident claim',
        status: ClaimStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
        fraudCheckCompleted: false,
      } as Claim;
    });

    it('should return a fraud result with required fields', async () => {
      const result: FraudResult = await service.detectFraud(mockClaim);

      expect(result).toBeDefined();
      expect(typeof result.isFraudulent).toBe('boolean');
      expect(typeof result.confidenceScore).toBe('number');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.modelVersion).toBe('mock-v1.0.0');
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should flag claims with suspicious keywords', async () => {
      mockClaim.description = 'urgent emergency accident total loss stolen fire flood';

      const result: FraudResult = await service.detectFraud(mockClaim);

      expect(result.metadata.riskFactors).toContain('multiple_suspicious_keywords');
    });

    it('should flag claims with very short descriptions', async () => {
      mockClaim.description = 'short';

      const result: FraudResult = await service.detectFraud(mockClaim);

      expect(result.metadata.riskFactors).toContain('description_too_short');
    });

    it('should flag claims with very long descriptions', async () => {
      mockClaim.description = 'x'.repeat(1001);

      const result: FraudResult = await service.detectFraud(mockClaim);

      expect(result.metadata.riskFactors).toContain('description_too_long');
    });

    it('should flag high-risk claim types', async () => {
      mockClaim.type = 'theft';

      const result: FraudResult = await service.detectFraud(mockClaim);

      expect(result.metadata.riskFactors).toContain('high_risk_claim_type');
    });

    it('should flag weekend submissions', async () => {
      // Create a claim submitted on Sunday (day 0)
      const sunday = new Date();
      sunday.setDate(sunday.getDate() - sunday.getDay());
      mockClaim.createdAt = sunday;

      const result: FraudResult = await service.detectFraud(mockClaim);

      expect(result.metadata.riskFactors).toContain('weekend_submission');
    });

    it('should determine fraud based on confidence threshold', async () => {
      // Test multiple times to account for randomness
      const results = await Promise.all(
        Array(10).fill(null).map(() => service.detectFraud(mockClaim))
      );

      results.forEach(result => {
        if (result.confidenceScore > 0.7) {
          expect(result.isFraudulent).toBe(true);
        } else {
          expect(result.isFraudulent).toBe(false);
        }
      });
    });

    it('should provide appropriate reason for fraud detection', async () => {
      const result: FraudResult = await service.detectFraud(mockClaim);

      expect(result.reason).toBeDefined();
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    });

    it('should include risk factors in metadata', async () => {
      const result: FraudResult = await service.detectFraud(mockClaim);

      expect(result.metadata.riskFactors).toBeDefined();
      expect(Array.isArray(result.metadata.riskFactors)).toBe(true);
    });
  });

  describe('getServiceStatus', () => {
    it('should return healthy status', async () => {
      const status = await service.getServiceStatus();

      expect(status).toBeDefined();
      expect(status.healthy).toBe(true);
      expect(status.message).toBeDefined();
      expect(typeof status.message).toBe('string');
    });
  });

  describe('fraud detection logic consistency', () => {
    it('should produce consistent results for identical claims', async () => {
      const claim1: Claim = {
        id: 1,
        type: 'auto',
        description: 'Standard car accident claim',
        status: ClaimStatus.PENDING,
        createdAt: new Date('2023-06-15T10:00:00Z'), // Thursday
        updatedAt: new Date(),
        userId: 1,
        fraudCheckCompleted: false,
      } as Claim;

      const claim2: Claim = { ...claim1, id: 2 };

      // Mock Math.random to ensure consistent results
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.5);

      try {
        const result1 = await service.detectFraud(claim1);
        const result2 = await service.detectFraud(claim2);

        // Should have similar confidence scores (within random variation)
        expect(Math.abs(result1.confidenceScore - result2.confidenceScore)).toBeLessThan(0.3);
        expect(result1.isFraudulent).toBe(result2.isFraudulent);
      } finally {
        Math.random = originalRandom;
      }
    });
  });
});