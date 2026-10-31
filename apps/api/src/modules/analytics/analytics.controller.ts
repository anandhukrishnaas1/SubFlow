import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  @Get('ai-insights')
  async getAiInsights() {
    return this.analyticsService.getAiInsights();
  }

  @Post('ai-ask')
  async askAiInsights(@Body() body: { question: string }) {
    return this.analyticsService.askAiQuestion(body?.question || '');
  }

  @Post('refresh')
  @Roles(UserRole.ADMIN)
  async refresh() {
    return this.analyticsService.recalculateAll();
  }
}
