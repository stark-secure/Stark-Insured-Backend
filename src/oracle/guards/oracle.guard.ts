import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class OracleGuard implements CanActivate {
  private readonly logger = new Logger(OracleGuard.name);
  private readonly authorizedOracleKeys: string[];

  constructor(private configService: ConfigService) {
    // In production, these would come from environment variables or a secure key management system
    this.authorizedOracleKeys = [
      // Hardcoded public keys for initial implementation
      '04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd5b8dec5235a0fa8722476c7709c02559e3aa73aa03918ba2d492eea75abea235',
      // Add more oracle public keys as needed
      this.configService.get<string>('ORACLE_PUBLIC_KEY_1', ''),
      this.configService.get<string>('ORACLE_PUBLIC_KEY_2', ''),
    ].filter(key => key.length > 0);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (!body || !body.signature || !body.claimId) {
      this.logger.warn('Oracle request missing required fields');
      throw new UnauthorizedException('Invalid oracle request format');
    }

    try {
      // Verify the signature
      const isValidSignature = await this.verifyOracleSignature(
        body.signature,
        body.claimId,
        body.eventType,
        body.timestamp,
        body.verificationData
      );

      if (!isValidSignature) {
        this.logger.warn(`Invalid oracle signature for claim ${body.claimId}`);
        throw new UnauthorizedException('Invalid oracle signature');
      }

      // Add oracle metadata to request for later use
      request.oracleMetadata = {
        verifiedAt: new Date(),
        signatureValid: true,
      };

      this.logger.log(`Oracle request verified for claim ${body.claimId}`);
      return true;
    } catch (error) {
      this.logger.error(`Oracle verification failed: ${error.message}`);
      throw new UnauthorizedException('Oracle verification failed');
    }
  }

  private async verifyOracleSignature(
    signature: string,
    claimId: number,
    eventType: string,
    timestamp: string,
    verificationData?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Create the message that should have been signed
      const message = this.createSignatureMessage(claimId, eventType, timestamp, verificationData);
      const messageHash = crypto.createHash('sha256').update(message).digest();

      // Try to verify against each authorized oracle key
      for (const publicKey of this.authorizedOracleKeys) {
        if (await this.verifySignatureWithKey(signature, messageHash, publicKey)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Signature verification error: ${error.message}`);
      return false;
    }
  }

  private createSignatureMessage(
    claimId: number,
    eventType: string,
    timestamp: string,
    verificationData?: Record<string, any>
  ): string {
    // Create a deterministic message for signing
    const baseMessage = `${claimId}:${eventType}:${timestamp}`;
    
    if (verificationData) {
      // Sort keys for deterministic ordering
      const sortedData = Object.keys(verificationData)
        .sort()
        .reduce((obj, key) => {
          obj[key] = verificationData[key];
          return obj;
        }, {});
      
      return `${baseMessage}:${JSON.stringify(sortedData)}`;
    }
    
    return baseMessage;
  }

  private async verifySignatureWithKey(
    signature: string,
    messageHash: Buffer,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Remove '0x' prefix if present
      const cleanSignature = signature.startsWith('0x') ? signature.slice(2) : signature;
      const cleanPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;

      // Convert hex strings to buffers
      const signatureBuffer = Buffer.from(cleanSignature, 'hex');
      const publicKeyBuffer = Buffer.from(cleanPublicKey, 'hex');

      // For ECDSA verification (secp256k1)
      const verify = crypto.createVerify('SHA256');
      verify.update(messageHash);
      
      // Create public key object
      const keyObject = crypto.createPublicKey({
        key: publicKeyBuffer,
        format: 'der',
        type: 'spki'
      });

      return verify.verify(keyObject, signatureBuffer);
    } catch (error) {
      this.logger.debug(`Key verification failed: ${error.message}`);
      return false;
    }
  }
}
