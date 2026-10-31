import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@subflow/shared';

@Controller('analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  async getKpis() {
    return this.analyticsService.getKpis();
  }

  @Get('revenue-trends')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getRevenueTrends() {
    return this.analyticsService.getRevenueTrends();
  }

  @Get('subscription-breakdown')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getSubscriptionBreakdown() {
    return this.analyticsService.getSubscriptionBreakdown();
  }

  @Get('revenue-leakage')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getRevenueLeakage() {
    return this.analyticsService.getRevenueLeakageReport();
  }

  @Post('refresh')
  @Roles(UserRole.ADMIN)
  async refresh() {
    return this.analyticsService.recalculateAll();
  }
}