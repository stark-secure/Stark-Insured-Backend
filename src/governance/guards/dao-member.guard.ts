/* eslint-disable prettier/prettier */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole, User } from '../../user/entities/user.entity';
import { StarknetDaoService } from '../services/starknet-dao.service';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Injectable()
export class DaoMemberGuard implements CanActivate {
  constructor(private readonly starknetDaoService: StarknetDaoService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }
    if (!user.starknetAddress) {
      throw new ForbiddenException('StarkNet address required for DAO membership check');
    }
    const isDaoMember = await this.starknetDaoService.isDaoMember(user.starknetAddress);
    if (!isDaoMember) {
      throw new ForbiddenException('DAO membership required');
    }
    return true;
  }
}
