import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User, UserRole } from '../user/entities/user.entity';
import { HashingService } from './hashing.service';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import { MfaMethod } from '../user/entities/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly hashingService: HashingService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && await this.hashingService.comparePassword(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.userService.updateRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userService.findOne(userId);
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.userService.updateRefreshToken(user.id, newRefreshToken);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async mfaSetup(userId: string, method: 'email' | 'authenticator') {
    if (method === 'authenticator') {
      // Generate TOTP secret
      const secret = speakeasy.generateSecret({ length: 20 });
      await this.userService.setMfaSecret(userId, secret.base32);
      await this.userService.setMfaMethod(userId, MfaMethod.AUTHENTICATOR);
      return { otpauth_url: secret.otpauth_url, secret: secret.base32 };
    } else if (method === 'email') {
      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      // Store OTP temporarily (in real implementation, use cache or DB)
      await this.userService.setMfaSecret(userId, otp);
      await this.userService.setMfaMethod(userId, MfaMethod.EMAIL);
      // Send OTP via email
      const user = await this.userService.findOne(userId);
      await this.mailService.sendTestEmail(user.email); // Replace with sendOtpEmail
      return { message: 'OTP sent to your email' };
    }
    throw new Error('Invalid MFA method');
  }

  async mfaVerify(userId: string, method: 'email' | 'authenticator', code: string) {
    const user = await this.userService.findOne(userId);
    if (method === 'authenticator') {
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
      });
      if (verified) {
        await this.userService.setMfaEnabled(userId, true);
        return { message: 'MFA enabled' };
      } else {
        throw new UnauthorizedException('Invalid authenticator code');
      }
    } else if (method === 'email') {
      if (user.mfaSecret === code) {
        await this.userService.setMfaEnabled(userId, true);
        return { message: 'MFA enabled' };
      } else {
        throw new UnauthorizedException('Invalid email OTP');
      }
    }
    throw new Error('Invalid MFA method');
  }

  async mfaDisable(userId: string, code: string) {
    const user = await this.userService.findOne(userId);
    // Require code verification for disabling MFA
    if (user.mfaEnabled) {
      if (
        (user.mfaMethod === MfaMethod.AUTHENTICATOR && speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token: code })) ||
        (user.mfaMethod === MfaMethod.EMAIL && user.mfaSecret === code)
      ) {
        await this.userService.clearMfa(userId);
        return { message: 'MFA disabled' };
      } else {
        throw new UnauthorizedException('Invalid code for disabling MFA');
      }
    }
    return { message: 'MFA already disabled' };
  }
}
