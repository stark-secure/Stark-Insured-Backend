import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashingService {
  private readonly saltRounds: number;

  constructor() {
    const rounds = process.env.BCRYPT_SALT_ROUNDS;
    this.saltRounds = rounds ? parseInt(rounds, 10) : 10;
  }

  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new InternalServerErrorException('Failed to hash password');
    }
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new InternalServerErrorException('Failed to compare password');
    }
  }
}
