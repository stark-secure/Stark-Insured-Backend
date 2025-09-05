# API Documentation (Overview)

This repository exposes an OpenAPI (Swagger) UI to help developers explore and test the API.

Summary
- Interactive docs at `/docs` (when enabled via `SWAGGER_ENABLED=true`).
- Versioned docs mount under `/docs/v1` and raw JSON under `/docs-json` and `/docs-json/v1`.
- API Versioning: The app uses URI versioning (default v1). Routes can use `@Version('1')` or rely on default.

How to enable locally (PowerShell)

1. Install dependencies:

```powershell
npm ci
```

2. Start the app with Swagger enabled:

```powershell
# Windows (PowerShell)
npm run start:dev --if-present # if special script exists; otherwise set env and start
```

Docs authoring guidance

- Decorate DTOs with `@ApiProperty()` from `@nestjs/swagger` to surface field descriptions and types.
- Use `@ApiResponse()` to document common responses and error shapes (400/401/403/404/500).
- Use `@ApiBearerAuth('JWT-auth')` on controllers or methods that require JWT auth.
- Keep controller `@ApiOperation()` summaries short and action-oriented.

Example DTO

```ts
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User login email' })
  email: string

  @ApiProperty({ example: 'P@ssw0rd!', description: 'User password' })
  password: string
}
```

Example error response shape

```ts
@ApiResponse({
  status: 400,
  description: 'Validation error',
  schema: {
    properties: {
      statusCode: { type: 'number' },
      message: { type: 'array', items: { type: 'string' } },
      error: { type: 'string' }
    }
  }
})
```

Keeping docs current

- When DTOs change, update `@ApiProperty()` metadata and any `@ApiResponse()` schemas.
- Add integration tests that assert `/docs-json` is reachable and contains expected paths (optional).

If you update docs, open a PR referencing issue #61.

Contributing tips

- When you change or add endpoints, update the controller with `@ApiOperation`, `@ApiResponse`, and use DTOs with `@ApiProperty()` so the OpenAPI JSON is accurate.
- Prefer explicit response DTOs (e.g., `LoginResponseDto`) and annotate them with `@ApiProperty()` to document shapes returned by the API.
- If you add a new API version, create a dedicated OpenAPI document for that version and mount it under `/docs/vX` and `/docs-json/vX`.

Batch annotation note (example run)

In this batch we annotated several DTOs as a demonstration and pattern for other maintainers. Files updated in this pass:

- `src/auth/auth.controller.ts` (LoginDto, RefreshTokenDto)
- `src/user/dto/create-user.dto.ts` (CreateUserDto)
- `src/policys/dto/create-policy.dto.ts` (CreatePolicyDto)
- `src/payment/dto/create-payment.dto.ts` (CreatePaymentDto)
- `src/multi-payments/payment.dto.ts` (multiple payment DTOs)

Follow this pattern when annotating additional DTOs: add `@ApiProperty()` with a short description and example where helpful, and prefer explicit response DTOs for returned shapes.
