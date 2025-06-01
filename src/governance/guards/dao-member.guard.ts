/* eslint-disable prettier/prettier */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole, User } from '../../user/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Injectable()
export class DaoMemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Stub implementation: For now, check if user is admin or has specific role
    // In production, this would verify DAO token stake or NFT ownership
    const isDaoMember = this.verifyDaoMembership(user);

    if (!isDaoMember) {
      throw new ForbiddenException('DAO membership required');
    }

    return true;
  }

  private verifyDaoMembership(user: User): boolean {
    // Stub implementation - in production this would:
    // 1. Check StarkNet wallet signature
    // 2. Verify DAO token balance
    // 3. Check NFT ownership
    // For now, allow admin users and assume others have DAO tokens
    return user.role === UserRole.ADMIN || user.isActive;
  }
}
