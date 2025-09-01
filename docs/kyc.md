
# KYC Verification Endpoint Stub


## Overview
This document describes the stubbed KYC (Know Your Customer) verification endpoint implemented in the backend. The endpoint simulates a real KYC provider and lays the foundation for future integration with actual KYC services (e.g., Sumsub, Persona, Veriff).

**Key Features:**
- Input validation using DTOs and `class-validator`.
- Simulated (mock) KYC provider logic with configurable outcomes.
- Secure handling of document images (hashing, not storing raw images).
- Privacy best practices: no logging of sensitive fields.
- Swagger documentation for request/response formats.


## Endpoints

### 1. Submit KYC Verification
- **POST** `/user/kyc/verify`
- **Auth:** JWT required
- **Body:**
  - `fullName` (string, required)
  - `dob` (string, required, ISO date)
  - `nationalId` (string, required)
  - `documentType` (enum: passport, national_id, drivers_license)
  - `documentImage` (base64 string, required)
  - `simulateResult` (enum: pending, approved, rejected, optional)
- **Returns:** KYC verification result (see below)

### 2. Get KYC Status
- **GET** `/user/kyc/status/:verificationId`
- **Auth:** JWT required
- **Returns:** Status and details for a specific verification

### 3. Get KYC History
- **GET** `/user/kyc/history`
- **Auth:** JWT required
- **Returns:** List of all KYC verifications for the user

## Request Example (POST /user/kyc/verify)
```json
{
  "fullName": "John Michael Doe",
  "dob": "1990-05-15",
  "nationalId": "A1234567890",
  "documentType": "national_id",
  "documentImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "simulateResult": "approved"
}
```

## Response Example (POST /user/kyc/verify)
```json
{
  "verificationId": "kyc_12345678-1234-5678-9012-123456789012",
  "status": "approved",
  "estimatedProcessingTime": 30,
  "submittedAt": "2024-01-15T10:30:00Z",
  "expectedCompletionAt": "2024-01-15T11:00:00Z",
  "metadata": {
    "provider": "mock-kyc-provider",
    "confidence": 0.95,
    "checksPerformed": ["document_authenticity", "face_match", "data_validation"]
  }
}
```


## Status Codes & Error Handling
- `201 Created`: KYC verification submitted successfully
- `400 Bad Request`: Invalid input or user already has approved KYC
- `401 Unauthorized`: JWT missing or invalid
- `404 Not Found`: User or verification not found

## Stubbed Behavior
- The endpoint does **not** connect to a real KYC provider.
- The `simulateResult` field can be used to force a specific result for testing (`approved`, `pending`, `rejected`).
- If not provided, the result is determined by mock logic (document quality, data consistency, risk score, and randomization).
- Document images are **hashed** before storage; only the hash is persisted for security.
- Sensitive fields (e.g., document images, national IDs) are **never logged**.
- Metadata includes mock provider info, confidence, and checks performed.


## Privacy & Security
- **No raw images stored:** Only a hash of the document image is saved in the database.
- **No logging of PII:** Sensitive fields are excluded from logs and error messages.
- **HTTPS required:** All KYC endpoints must be accessed over secure transport.
- **Access control:** Only authenticated users can access their own KYC data.


## Testing & Simulating Scenarios
- Use the `simulateResult` field to test all possible outcomes:
  - `approved`: Simulates a successful verification
  - `pending`: Simulates a manual review
  - `rejected`: Simulates a failed verification
- If `simulateResult` is omitted, the backend uses mock logic to determine the result (see `KycService.simulateKycVerification`).

## Extending for Real Providers
- Replace the logic in `KycService.simulateKycVerification` with real API calls to a KYC provider.
- Store and process provider responses, including asynchronous updates if required.
- Add webhooks or polling for real-time status updates.
- Ensure compliance with local regulations for KYC data storage and processing.


---
For more details, see the Swagger documentation or contact the backend team.
