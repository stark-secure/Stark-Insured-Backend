import { Claim } from '../../claim/entities/claim.entity'; 


export interface FraudResult {

  isFraudulent: boolean;
  
  confidenceScore: number;
  
  reason?: string;
  
  metadata?: {
    riskFactors?: string[];
    modelVersion?: string;
    timestamp?: Date;
  };
}

export abstract class FraudDetectionService {
  /**
   * Analyzes a claim for potential fraud
   * @param claim The claim entity to analyze
   * @returns Promise resolving to fraud detection result
   */
  abstract detectFraud(claim: Claim): Promise<FraudResult>;
  
  /**
   * Optional method to get service health/status
   * @returns Promise resolving to service status
   */
  abstract getServiceStatus?(): Promise<{ healthy: boolean; message?: string }>;
}