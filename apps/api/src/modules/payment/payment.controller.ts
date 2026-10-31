import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaymentService } from './payment.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { assertCustomerOwnsResource } from '../../common/guards/customer-resource.guard';
import { PaymentMethod, UserRole } from '@subflow/shared';

class RecordPaymentDto {
  @IsString()
  @MinLength(1)
  invoiceId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  transactionRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
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
    assertCustomerOwnsResource(user, payment, 'Payment');
    return payment;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async recordPayment(@Body() dto: RecordPaymentDto) {
    return this.paymentService.recordPayment(dto);
  }
}
