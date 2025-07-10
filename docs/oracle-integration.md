# Oracle Integration for StarkInsured Backend

## Overview

The Oracle module provides automated off-chain data verification for policy claims in the StarkInsured platform. By integrating oracles, the system can verify real-world events (e.g., wallet exploits, protocol downtime, smart contract hacks) before claim approval and set the `oracleVerified` flag to indicate eligibility.

## Architecture

### Components

1. **OracleService** (`src/oracle/oracle.service.ts`)
   - Core service for oracle verification logic
   - Handles signature verification and claim updates
   - Manages confidence scoring and verification metadata

2. **OracleController** (`src/oracle/oracle.controller.ts`)
   - REST API endpoints for oracle interactions
   - Secure verification endpoint with signature validation
   - Status checking and legacy support

3. **OracleGuard** (`src/oracle/guards/oracle.guard.ts`)
   - Security guard for oracle endpoint protection
   - Cryptographic signature verification
   - Authorized oracle key validation

4. **DTOs and Interfaces**
   - `OracleVerificationDto`: Request payload structure
   - `OracleVerificationResponseDto`: Response format
   - Event type definitions and validation

## API Endpoints

### POST /oracle/verify

**Primary oracle verification endpoint** - Restricted to authorized oracles only.

**Request Body:**
```json
{
  "claimId": 123,
  "signature": "0x1234567890abcdef...",
  "eventType": "wallet_exploit",
  "timestamp": "2024-01-15T10:30:00Z",
  "verificationData": {
    "transactionHash": "0xabc123...",
    "blockNumber": 18500000,
    "affectedAddress": "0xdef456..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "claimId": 123,
  "message": "Claim successfully verified by oracle",
  "verifiedAt": "2024-01-15T10:35:00Z",
  "signatureValid": true,
  "metadata": {
    "eventType": "wallet_exploit",
    "originalTimestamp": "2024-01-15T10:30:00Z",
    "confidenceScore": 0.95
  }
}
```

### GET /oracle/status/:claimId

**Check oracle verification status** for a specific claim.

**Response:**
```json
{
  "verified": true,
  "data": {
    "verifiedAt": "2024-01-15T10:35:00Z",
    "eventType": "wallet_exploit",
    "confidenceScore": 0.95,
    "oracleVerification": {
      "success": true,
      "verifiedBy": "oracle-system"
    }
  }
}
```

## Event Types

The system supports verification of various off-chain events:

- `WALLET_EXPLOIT`: Wallet compromise or exploit
- `PROTOCOL_DOWNTIME`: Protocol or service downtime
- `SMART_CONTRACT_HACK`: Smart contract vulnerability exploitation
- `PRICE_MANIPULATION`: Market manipulation events
- `BRIDGE_EXPLOIT`: Cross-chain bridge exploits
- `GOVERNANCE_ATTACK`: DAO governance attacks
- `OTHER`: Other verifiable events

## Security Features

### Signature Verification

The Oracle Guard implements robust cryptographic signature verification:

1. **Message Construction**: Creates deterministic messages from claim data
2. **Signature Validation**: Verifies ECDSA signatures against authorized public keys
3. **Timestamp Validation**: Ensures oracle data freshness (configurable max age)
4. **Key Management**: Supports multiple authorized oracle public keys

### Authorization

- Only requests with valid signatures from authorized oracles are processed
- Public keys are configurable via environment variables
- Failed verification attempts are logged for security monitoring

## Configuration

### Environment Variables

```env
# Oracle Configuration
ORACLE_PUBLIC_KEY_1=04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd...
ORACLE_PUBLIC_KEY_2=04b45c88e33d891d5f47c3c4d3d46b47ec17337f52d793g93c9c67bd2d651d6ce...
ORACLE_MAX_TIMESTAMP_AGE=86400  # 24 hours in seconds
```

### Hardcoded Keys (Development)

For initial implementation, a default public key is hardcoded:
```
04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd5b8dec5235a0fa8722476c7709c02559e3aa73aa03918ba2d492eea75abea235
```

## Integration with Claims

### Database Schema Updates

The `Claim` entity now includes:
```typescript
@Column({ type: 'boolean', default: false })
oracleVerified: boolean;
```

### Claim Processing Flow

1. **Claim Submission**: User submits claim
2. **Fraud Detection**: Automated fraud screening
3. **Oracle Verification**: Off-chain event verification (if applicable)
4. **Admin Review**: Final approval/rejection
5. **Payout Processing**: Claim settlement

### Confidence Scoring

The system calculates confidence scores based on:
- **Event Type**: Different base scores for event reliability
- **Verification Data Quality**: Additional points for blockchain evidence
- **Oracle Reputation**: Future enhancement for oracle reliability

**Scoring Examples:**
- Wallet Exploit with transaction hash: 0.95
- Protocol Downtime: 0.85
- Other events: 0.60

## Testing

### Unit Tests

Comprehensive test coverage includes:
- **OracleService**: Verification logic, confidence scoring, error handling
- **OracleController**: Endpoint functionality, error responses
- **OracleGuard**: Signature verification, security validation

### Integration Tests

- **End-to-End Verification**: Complete oracle verification flow
- **Security Testing**: Invalid signature handling, unauthorized access
- **Error Scenarios**: Network failures, invalid data handling

## Monitoring and Logging

### Key Metrics

- Oracle verification success/failure rates
- Signature validation attempts
- Timestamp validation failures
- Confidence score distributions

### Security Monitoring

- Failed signature verification attempts
- Unauthorized access attempts
- Unusual verification patterns
- Oracle response times

## Future Enhancements

### Planned Improvements

1. **Multiple Oracle Support**: Consensus-based verification
2. **Oracle Reputation System**: Track oracle reliability over time
3. **Dynamic Key Management**: Secure key rotation and management
4. **Advanced Event Types**: Support for more complex verification scenarios
5. **Real-time Notifications**: Instant claim updates via WebSocket

### Scalability Considerations

- **Oracle Pool Management**: Load balancing across multiple oracles
- **Caching Layer**: Cache verification results for performance
- **Rate Limiting**: Prevent oracle endpoint abuse
- **Batch Processing**: Handle multiple verifications efficiently

## Troubleshooting

### Common Issues

1. **Invalid Signature Errors**
   - Check oracle public key configuration
   - Verify signature format (hex with 0x prefix)
   - Ensure message construction matches oracle implementation

2. **Timestamp Validation Failures**
   - Check system clock synchronization
   - Verify ORACLE_MAX_TIMESTAMP_AGE configuration
   - Ensure oracle timestamps are in ISO format

3. **Claim Not Found Errors**
   - Verify claim ID exists in database
   - Check claim status and eligibility for oracle verification

### Debug Mode

Enable detailed logging for troubleshooting:
```typescript
// In oracle.service.ts
this.logger.debug(`Processing oracle verification for claim ${claimId}`);
```

## API Documentation

The Oracle endpoints are fully documented in Swagger UI at `/docs` when the application is running. The documentation includes:

- Request/response schemas
- Authentication requirements
- Error response formats
- Example payloads

Access the interactive API documentation at: `http://localhost:3000/docs`
