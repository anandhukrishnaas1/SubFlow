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
  @Roles(UserRole.ADMIN)
  async triggerBillingRun() {
    return this.billingService.runBillingCycle();
  }

  @Get('due')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getDueSubscriptions() {
    return this.billingService.findDueSubscriptions();
  }
}
