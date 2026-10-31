import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '@subflow/shared';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsCopilotService } from './analytics-copilot.service';

class AnalyticsDateRangeQuery {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

class RenewalsQuery {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  days = 7;
}

class AnalyticsQuestionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MinLength(1)
  @MaxLength(1000)
  question!: string;
}

@Controller('analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly copilot: AnalyticsCopilotService,
  ) {}

  @Get('kpis')
  getKpis() {
    return this.analyticsService.getKpis();
  }

  @Get('financial-summary')
  getFinancialSummary() {
    return this.analyticsService.getKpis();
  }

  @Get('revenue-trends')
  getRevenueTrends(@Query() range: AnalyticsDateRangeQuery) {
    this.validateRange(range);
    return this.analyticsService.getRevenueTrends(range.from, range.to);
  }

  @Get('billing-trends')
  getBillingTrends(@Query() range: AnalyticsDateRangeQuery) {
    this.validateRange(range);
    return this.analyticsService.getRevenueTrends(range.from, range.to);
  }

  @Get('subscription-breakdown')
  getSubscriptionBreakdown() {
    return this.analyticsService.getSubscriptionBreakdown();
  }

  @Get('subscription-metrics')
  getSubscriptionMetrics() {
    return this.analyticsService.getSubscriptionMetrics();
  }

  @Get('renewals')
  getRenewals(@Query() query: RenewalsQuery) {
    return this.analyticsService.getRenewals(query.days);
  }

  @Get('risks')
  getRisks() {
    return this.analyticsService.getRisks();
  }

  @Get('insights')
  getInsights() {
    return this.analyticsService.getInsights();
  }

  @Post('ask')
  async ask(@Body() body: AnalyticsQuestionDto) {
    const verifiedResponse = await this.analyticsService.ask(body.question);
    return this.copilot.explain(verifiedResponse);
  }

  @Post('refresh')
  @Roles(UserRole.ADMIN)
  refresh() {
    return this.analyticsService.recalculateAll();
  }

  private validateRange(range: AnalyticsDateRangeQuery): void {
    if (range.from && range.to && new Date(range.from) > new Date(range.to)) {
      throw new BadRequestException('The from date must be before or equal to the to date.');
    }
  }
}
