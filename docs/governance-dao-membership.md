# StarkNet DAO Membership Integration

## Overview
This project uses a guard (`DaoMemberGuard`) to restrict access to governance actions to only verified StarkNet DAO members. Membership is checked using the user's `starknetAddress` and the `StarknetDaoService`.

## Integration Steps

1. **User Entity**: Ensure the `User` entity has a `starknetAddress` field. This is used to check DAO membership.
2. **StarknetDaoService**: This service should be updated to use the real [StarkNet.js](https://www.starknetjs.com/) SDK or another relevant library to check on-chain DAO membership.
   - Replace the stub logic in `isDaoMember` with a contract call or other membership check.
3. **Guard Usage**: The `DaoMemberGuard` is applied to all routes/actions that require DAO membership. It will throw a `403 Forbidden` if the user is not a verified member.
4. **Testing**: The guard and service are designed for easy mocking in tests. Simulate both valid and invalid membership scenarios.

## Example: Checking Membership

```
@Injectable()
export class StarknetDaoService {
  async isDaoMember(starknetAddress: string): Promise<boolean> {
    // TODO: Replace with real StarkNet.js logic
    // Example: Query on-chain contract for membership
    return Boolean(starknetAddress && starknetAddress.length > 0);
  }
}
```

## Assumptions
- Users must have a valid `starknetAddress` to be considered for DAO membership.
- The actual on-chain membership logic is to be implemented in `StarknetDaoService`.

---

# Proposal Expiry Handling

- Proposals are automatically set to `EXPIRED` if their `expiryDate` has passed.
- Voting is blocked on expired proposals.
- The scheduled expiry logic should be run periodically (e.g., via a cron job or NestJS scheduler).

---

# Testing

- Unit and integration tests should cover:
  - Proposal expiry and status update
  - Voting restrictions on expired proposals
  - DAO membership guard (valid/invalid cases)

---

# References
- [StarkNet.js Documentation](https://www.starknetjs.com/)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling)
