import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { LpTokenService } from './lp-token.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MintLpTokenDto } from './dtos/mint-lp-token.dto';
import { BurnLpTokenDto } from './dtos/burn-lp-token.dto';
import { LpTokenEventQueryDto } from './dtos/lp-token-event-query.dto';
import { PaginatedLpTokenEventResponseDto } from './dtos/paginated-lp-token-event-response.dto';
import { LpBalanceHistoryQueryDto } from './dtos/lp-balance-history-query.dto';
import { LpBalanceHistoryResponseDto } from './dtos/lp-balance-history-response.dto';
import { ApiQuery, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('lp-token')
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

  @Get('events')
  @ApiQuery({ name: 'eventType', required: false, enum: ['mint', 'burn'] })
  @ApiQuery({ name: 'userAddress', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedLpTokenEventResponseDto })
  async getEvents(@Query() query: LpTokenEventQueryDto): Promise<PaginatedLpTokenEventResponseDto> {
    return this.lpTokenService.getEvents(query);
  }

  @Get('history/:userId')
  @ApiParam({ name: 'userId', type: String, description: 'User ID to get balance history for' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'interval', required: false, enum: ['daily', 'weekly', 'monthly'], description: 'Aggregation interval' })
  @ApiResponse({ status: 200, type: LpBalanceHistoryResponseDto })
  async getBalanceHistory(
    @Param('userId') userId: string,
    @Query() query: LpBalanceHistoryQueryDto,
  ): Promise<LpBalanceHistoryResponseDto> {
    return this.lpTokenService.getBalanceHistory(userId, query);
  }
}
