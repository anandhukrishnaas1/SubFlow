import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MaxLength, IsDateString } from 'class-validator';
import { PaymentService } from './payment.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@subflow/shared';
import { PaymentMethod } from '@subflow/shared';

class RecordPaymentDto {
  @IsString()
  invoiceId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  transactionRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}

@Controller('payments')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('customerId') customerId?: string,
    @Query('invoiceId') invoiceId?: string,
  ) {
    if (user.role === UserRole.CUSTOMER) {
      return this.paymentService.findAll({ customerId: user.uid, invoiceId });
    }
    return this.paymentService.findAll({ customerId, invoiceId });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const payment = await this.paymentService.findOne(id);
    if (user.role === UserRole.CUSTOMER && payment.customerId !== user.uid) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  @Post()
  async recordPayment(
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.recordPayment(
      dto,
      user.role === UserRole.CUSTOMER ? user.uid : undefined,
    );
  }
}
