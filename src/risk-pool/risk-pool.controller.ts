import { Controller, Post, Get, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RiskPoolService } from './risk-pool.service';
import { CreateRiskPoolDto } from './dto/create-risk-pool.dto';
import { UpdateRiskPoolDto } from './dto/update-risk-pool.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('risk-pools')
export class RiskPoolController {
  constructor(private readonly riskPoolService: RiskPoolService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createRiskPoolDto: CreateRiskPoolDto) {
    return this.riskPoolService.create(createRiskPoolDto);
  }

  @Get()
  findAll() {
    return this.riskPoolService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.riskPoolService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRiskPoolDto: UpdateRiskPoolDto) {
    return this.riskPoolService.update(id, updateRiskPoolDto);
  }
}