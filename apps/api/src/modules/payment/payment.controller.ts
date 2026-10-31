import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@subflow/shared';

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
  async findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Post()
  async recordPayment(
    @Body() dto: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.recordPayment(dto);
  }
}
