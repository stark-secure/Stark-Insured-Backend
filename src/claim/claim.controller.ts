import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ClaimService } from './claim.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClaimResponseDto } from './dto/claim_response_dto';

@ApiTags('claims')
@ApiBearerAuth()
@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new claim',
    description:
      'Creates a new insurance claim and sends email notification to the user confirming submission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Claim created successfully. Email notification sent to user.',
    type: ClaimResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Body() createClaimDto: CreateClaimDto,
    @Request() req: any,
  ): Promise<ClaimResponseDto> {
    return this.claimService.create(createClaimDto, req.user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user claims' })
  @ApiResponse({
    status: 200,
    description: 'User claims retrieved successfully',
    type: [ClaimResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findMyClaims(@Request() req: any): Promise<ClaimResponseDto[]> {
    return this.claimService.findAllByUser(req.user.id);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get claim statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Claim statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getStats(): Promise<any> {
    return this.claimService.getClaimStats();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get all claims (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All claims retrieved successfully',
    type: [ClaimResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findAll(): Promise<ClaimResponseDto[]> {
    return this.claimService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific claim' })
  @ApiParam({ name: 'id', description: 'Claim ID' })
  @ApiResponse({
    status: 200,
    description: 'Claim retrieved successfully',
    type: ClaimResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only access your own claims',
  })
  @ApiResponse({
    status: 404,
    description: 'Claim not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<ClaimResponseDto> {
    const isAdmin = req.user.roles?.includes('admin') || req.user.role === 'admin';
    return this.claimService.findOne(id, req.user.id, isAdmin);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Update a claim (Admin only)',
    description:
      'Updates claim status and sends email notification to user about status change. Supported status transitions: PENDING → APPROVED, PENDING → REJECTED.',
  })
  @ApiParam({ name: 'id', description: 'Claim ID' })
  @ApiResponse({
    status: 200,
    description:
      'Claim updated successfully. Email notification sent to user about status change.',
    type: ClaimResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Claim not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClaimDto: UpdateClaimDto,
    @Request() req: any,
  ): Promise<ClaimResponseDto> {
    const isAdmin = req.user.roles?.includes('admin') || req.user.role === 'admin';
    return this.claimService.update(id, updateClaimDto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a claim' })
  @ApiParam({ name: 'id', description: 'Claim ID' })
  @ApiResponse({
    status: 204,
    description: 'Claim deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You can only delete your own claims or be an admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Claim not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    const isAdmin = req.user.roles?.includes('admin') || req.user.role === 'admin';
    return this.claimService.remove(id, req.user.id, isAdmin);
  }
}
