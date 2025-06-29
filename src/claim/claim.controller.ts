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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path based on your project
import { RolesGuard } from '../auth/guards/roles.guard'; // Adjust path based on your project
import { Roles } from '../auth/decorators/roles.decorator'; // Adjust path based on your project
import { ClaimResponseDto } from './dto/claim_response_dto';

@ApiTags('claims')
@ApiBearerAuth()
@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new claim' })
  @ApiResponse({
    status: 201,
    description: 'Claim created successfully. Fraud detection will run automatically.',
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
  async findMyCllaims(@Request() req: any): Promise<ClaimResponseDto[]> {
    return this.claimService.findAllByUser(req.user.id);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get claim statistics including fraud metrics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Claim statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total number of claims' },
        pending: { type: 'number', description: 'Number of pending claims' },
        approved: { type: 'number', description: 'Number of approved claims' },
        rejected: { type: 'number', description: 'Number of rejected claims' },
        flagged: { type: 'number', description: 'Number of fraud-flagged claims' },
        fraudulent: { type: 'number', description: 'Number of fraudulent claims' },
        fraudCheckCompleted: { type: 'number', description: 'Number of claims with completed fraud checks' },
        fraudCheckPending: { type: 'number', description: 'Number of claims with pending fraud checks' },
      },
    },
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

  @Get('fraud-detection/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get fraud detection service status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Fraud detection service status',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean', description: 'Whether the fraud detection service is healthy' },
        message: { type: 'string', description: 'Status message' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getFraudDetectionStatus(): Promise<{ healthy: boolean; message?: string }> {
    return this.claimService.getFraudDetectionStatus();
  }

  @Post(':id/fraud-check')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Manually trigger fraud detection for a claim (Admin only)' })
  @ApiParam({ name: 'id', description: 'Claim ID' })
  @ApiResponse({
    status: 200,
    description: 'Fraud detection completed successfully',
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
  async triggerFraudCheck(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.claimService.runFraudDetection(id);
    return { message: `Fraud detection completed for claim ${id}` };
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
  @ApiOperation({ summary: 'Update a claim (Admin only)' })
  @ApiParam({ name: 'id', description: 'Claim ID' })
  @ApiResponse({
    status: 200,
    description: 'Claim updated successfully',
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