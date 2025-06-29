/* eslint-disable prettier/prettier */
// payment.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PolicyService } from '../policy/policy.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private policyService: PolicyService,
  ) {}

  async createPayment(dto: CreatePaymentDto, userId: string) {
    const policy = await this.policyService.findById(dto.policyId);
    if (!policy || policy.userId !== userId)
      throw new ForbiddenException('Access denied');
    if (dto.token !== policy.token)
      throw new ForbiddenException('Token mismatch');

    const payment = this.paymentRepo.create({ ...dto, userId });
    return this.paymentRepo.save(payment);
  }

  async getMyPayments(userId: string) {
    return this.paymentRepo.find({ where: { userId } });
  }
  async findPaymentsForUser(userId: string): Promise<Payment[]> {
    return this.paymentRepo.find({ where: { userId } });
  }

  async updatePaymentStatus(id: number, dto: UpdatePaymentStatusDto) {
    const payment = await this.paymentRepo.findOneBy({ id });
    if (!payment) throw new NotFoundException('Payment not found');

    payment.status = dto.status;
    payment.paidAt = dto.paidAt || new Date();

    await this.paymentRepo.save(payment);

    if (dto.status === PaymentStatus.CONFIRMED) {
      const policy = await this.policyService.findById(payment.policyId);
      if (policy.status === 'PENDING') {
        policy.status = 'ACTIVE';
        await this.policyService.update(policy);
      }
    }
    return payment;
  }
}
