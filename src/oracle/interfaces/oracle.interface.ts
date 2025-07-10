import { EventType } from '../dto/create-oracle.dto';

export interface OracleVerificationResult {
  success: boolean;
  claimId: number;
  eventType: EventType;
  timestamp: Date;
  signatureValid: boolean;
  verificationData?: Record<string, any>;
  oracleId?: string;
  confidenceScore?: number;
}

export interface OracleConfig {
  publicKeys: string[];
  signatureAlgorithm: 'ECDSA' | 'RSA';
  hashAlgorithm: 'SHA256' | 'SHA512';
  maxTimestampAge: number; // in seconds
}

export interface SignatureVerificationResult {
  valid: boolean;
  oracleId?: string;
  publicKey?: string;
  error?: string;
}
