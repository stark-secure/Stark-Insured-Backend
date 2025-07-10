import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PolicyService } from './policys.service';

interface RequestWithUser extends Request {
  user: {
    id: number;
    roles?: string[];
  };
}

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post()
  async create(
    @Body() createPolicyDto: CreatePolicyDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = String(req.user.id);
    return this.policyService.create(createPolicyDto, userId);
  }

  @Get('me')
  async getMyPolicies(@Request() req: RequestWithUser) {
    const userId = String(req.user.id);
    return this.policyService.getPoliciesForUser(userId);
  }

  @Get('me/active')
  async getMyActivePolicies(@Request() req: RequestWithUser) {
    const userId = String(req.user.id);
    return this.policyService.getActivePoliciesForUser(userId);
  }

  @Get('me/coverage-total')
  async getMyCoverageTotal(@Request() req: RequestWithUser) {
    const userId = String(req.user.id);
    const total = await this.policyService.getTotalCoverageForUser(userId);
    return { totalCoverage: total };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    const userId = String(req.user.id);
    const isAdmin = req.user.roles?.includes('admin');

    return this.policyService.findOne(id, isAdmin ? undefined : userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePolicyDto: UpdatePolicyDto,
    @Request() req: RequestWithUser,
  ) {
    const userId = String(req.user.id);
    const isAdmin = req.user.roles?.includes('admin');

    return this.policyService.update(id, updatePolicyDto, userId, isAdmin);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    const userId = String(req.user.id);
    const isAdmin = req.user.roles?.includes('admin');

    return this.policyService.cancel(id, userId, isAdmin);
  }

  // Admin-only endpoints (optional)
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll() {
    return this.policyService.findAll();
  }
}
