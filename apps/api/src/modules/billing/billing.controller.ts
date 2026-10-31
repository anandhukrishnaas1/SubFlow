import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@subflow/shared';

@Controller('billing')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('run')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async triggerBillingRun() {
    return this.billingService.runBillingCycle();
  }

  @Post('check-overdue')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async triggerOverdueCheck() {
    return this.billingService.markOverdueInvoices();
  }

  @Get('due')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getDueSubscriptions() {
    return this.billingService.findDueSubscriptions();
  }
}
