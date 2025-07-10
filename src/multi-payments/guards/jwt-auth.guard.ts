import { CanActivate } from '@nestjs/common';

// Stub for JWT Auth Guard
export class JwtAuthGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
