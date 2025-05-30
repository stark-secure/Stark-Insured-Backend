/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Authenticated user creates a payment
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreatePaymentDto,
    @Req() req: import('express').Request & { user: { id: number } },
  ) {
    return this.paymentService.createPayment(dto, req.user.id);
  }

  // Authenticated user views their own payments
  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyPayments(
    @Req() req: import('express').Request & { user: { id: number } },
  ) {
    return this.paymentService.findPaymentsForUser(req.user.id);
  }

  // Admin/system confirms or rejects a payment
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.paymentService.updatePaymentStatus(+id, dto);
  }
}
