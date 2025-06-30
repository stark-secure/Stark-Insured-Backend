import { Injectable, Logger } from '@nestjs/common';
import { FraudDetectionService, FraudResult } from '../interfaces/fraud-detection.interface';
import { Claim } from '../../claim/entities/claim.entity';

@Injectable()
export class MockFraudDetectionService extends FraudDetectionService {
  private readonly logger = new Logger(MockFraudDetectionService.name);

  async detectFraud(claim: Claim): Promise<FraudResult> {
    this.logger.log(`Running fraud detection for claim ID: ${claim.id}`);
    
    // Simulate processing delay
    await this.simulateProcessingDelay();
    
    // Mock fraud detection rules
    const fraudRules = this.evaluateFraudRules(claim);
    
    // Calculate confidence score based on risk factors
    const confidenceScore = this.calculateConfidenceScore(fraudRules.riskFactors);
    
    // Determine if fraudulent based on confidence threshold
    const isFraudulent = confidenceScore > 0.7;
    
    const result: FraudResult = {
      isFraudulent,
      confidenceScore,
      reason: fraudRules.reason,
      metadata: {
        riskFactors: fraudRules.riskFactors,
        modelVersion: 'mock-v1.0.0',
        timestamp: new Date(),
      },
    };

    this.logger.log(
      `Fraud detection result for claim ${claim.id}: ${
        isFraudulent ? 'FRAUDULENT' : 'LEGITIMATE'
      } (confidence: ${confidenceScore.toFixed(2)})`
    );

    return result;
  }

  /**
   * Simulate service health check
   */
  async getServiceStatus(): Promise<{ healthy: boolean; message?: string }> {
    return {
      healthy: true,
      message: 'Mock fraud detection service is operational',
    };
  }

  /**
   * Evaluate mock fraud detection rules
   */
  private evaluateFraudRules(claim: Claim): {
    riskFactors: string[];
    reason: string;
  } {
    const riskFactors: string[] = [];
    
    // Rule 1: Check for suspicious keywords in description
    const suspiciousKeywords = [
      'urgent', 'emergency', 'accident', 'total loss', 'stolen',
      'fire', 'flood', 'damaged', 'broken', 'immediate'
    ];
    
    const descriptionLower = claim.description.toLowerCase();
    const foundKeywords = suspiciousKeywords.filter(keyword => 
      descriptionLower.includes(keyword)
    );
    
    if (foundKeywords.length > 2) {
      riskFactors.push('multiple_suspicious_keywords');
    }
    
    // Rule 2: Check description length (very short or very long descriptions)
    if (claim.description.length < 20) {
      riskFactors.push('description_too_short');
    } else if (claim.description.length > 1000) {
      riskFactors.push('description_too_long');
    }
    
    // Rule 3: Check claim type patterns
    const highRiskTypes = ['theft', 'fire', 'water damage', 'total loss'];
    if (highRiskTypes.some(type => 
      claim.type.toLowerCase().includes(type.toLowerCase())
    )) {
      riskFactors.push('high_risk_claim_type');
    }
    
    // Rule 4: Random factor to simulate unpredictable ML behavior
    if (Math.random() > 0.8) {
      riskFactors.push('anomaly_detected');
    }
    
    // Rule 5: Check for weekend submissions (higher fraud risk)
    const claimDate = new Date(claim.createdAt);
    const dayOfWeek = claimDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      riskFactors.push('weekend_submission');
    }
    
    // Generate reason based on risk factors
    let reason = 'Analysis completed';
    if (riskFactors.length > 0) {
      reason = `Risk factors identified: ${riskFactors.join(', ')}`;
    }
    
    return { riskFactors, reason };
  }

  /**
   * Calculate confidence score based on risk factors
   */
  private calculateConfidenceScore(riskFactors: string[]): number {
    // Base score
    let score = 0.1;
    
    // Add weight for each risk factor
    const riskWeights: { [key: string]: number } = {
      'multiple_suspicious_keywords': 0.3,
      'description_too_short': 0.2,
      'description_too_long': 0.15,
      'high_risk_claim_type': 0.25,
      'anomaly_detected': 0.4,
      'weekend_submission': 0.1,
    };
    
    riskFactors.forEach(factor => {
      score += riskWeights[factor] || 0.1;
    });
    
    // Add some randomness to simulate ML uncertainty
    score += (Math.random() - 0.5) * 0.2;
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Simulate processing delay
   */
  private async simulateProcessingDelay(): Promise<void> {
    const delay = Math.random() * 100 + 50; // 50-150ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}