import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole, SubscriptionStatus } from '@subflow/shared';

@Controller('subscriptions')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('planId') planId?: string,
  ) {
    if (user.role === UserRole.CUSTOMER) {
      return this.subscriptionService.findAll({ customerId: user.uid, status, planId });
    }
    return this.subscriptionService.findAll({ customerId, status, planId });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const subscription = await this.subscriptionService.findOne(id);
    this.assertOwner(subscription, user);
    return subscription;
  }

  @Get(':id/activities')
  async getActivities(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOwner(await this.subscriptionService.findOne(id), user);
    return this.subscriptionService.getActivities(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(
    @Body() dto: any,
    @CurrentUser('uid') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.subscriptionService.create(dto, userId, userName);
  }

  @Post('convert-quotation')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async convertQuotation(
    @Body() dto: { quotationId: string; planId?: string },
    @CurrentUser('uid') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.subscriptionService.convertFromQuotation(
      dto.quotationId,
      dto.planId || 'plan_pro_monthly',
      userId,
      userName,
    );
  }

  @Post('auto-renew')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async triggerAutoRenewals() {
    return this.subscriptionService.processAutoRenewals();
  }

  @Patch(':id/renew')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async renew(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.subscriptionService.renew(id, userId, userName);
  }

  @Post(':id/renew')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async renewPost(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.subscriptionService.renew(id, userId, userName);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async confirm(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.subscriptionService.setStatus(
      id,
      SubscriptionStatus.CONFIRMED,
      userId,
      userName,
    );
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async activate(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.subscriptionService.setStatus(
      id,
      SubscriptionStatus.ACTIVE,
      userId,
      userName,
    );
  }

  @Patch(':id/pause')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async pause(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.subscriptionService.setStatus(
      id,
      SubscriptionStatus.PAUSED,
      userId,
      userName,
    );
  }

  @Patch(':id/resume')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async resume(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.subscriptionService.setStatus(
      id,
      SubscriptionStatus.ACTIVE,
      userId,
      userName,
    );
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOwner(await this.subscriptionService.findOne(id), user);
    return this.subscriptionService.setStatus(
      id,
      SubscriptionStatus.CANCELLED,
      user.uid,
      user.name,
      { reason },
    );
  }

  private assertOwner(
    resource: { customerId?: string },
    user: AuthenticatedUser,
  ): void {
    if (user.role === UserRole.CUSTOMER && resource.customerId !== user.uid) {
      throw new NotFoundException('Subscription not found');
    }
  }

  @Patch(':id/close')
  @Roles(UserRole.ADMIN)
  async close(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.subscriptionService.setStatus(
      id,
      SubscriptionStatus.CLOSED,
      userId,
      userName,
    );
  }
}
