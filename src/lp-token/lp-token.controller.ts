import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { LpTokenService } from './lp-token.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MintLpTokenDto } from './dtos/mint-lp-token.dto';
import { BurnLpTokenDto } from './dtos/burn-lp-token.dto';

@Controller('lp-token')
@UseGuards(JwtAuthGuard)
export class LpTokenController {
  constructor(private readonly lpTokenService: LpTokenService) {}

  @Post('mint')
  async mint(@Request() req, @Body() dto: MintLpTokenDto) {
    return this.lpTokenService.mint(req.user.id, dto);
  }

  @Post('burn')
  async burn(@Request() req, @Body() dto: BurnLpTokenDto) {
    return this.lpTokenService.burn(req.user.id, dto);
  }

  @Get('me')
  async getMyTokens(@Request() req) {
    return this.lpTokenService.findByUser(req.user.id);
  }
}