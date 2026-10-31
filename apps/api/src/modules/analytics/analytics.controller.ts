import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { AnalyticsService } from './analytics.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@subflow/shared';

class AnalyticsDateRangeQuery {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

class AnalyticsQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  question!: string;
}

class RenewalsQuery {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  days = 7;
}

@Controller('analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  async getKpis() {
    return this.analyticsService.getKpis();
  }

  @Get('financial-summary')
  async getFinancialSummary() {
    return this.analyticsService.getKpis();
  }

  @Get('revenue-trends')
  async getRevenueTrends(@Query() range: AnalyticsDateRangeQuery) {
    this.validateRange(range);
    return this.analyticsService.getRevenueTrends(range.from, range.to);
  }

  @Get('billing-trends')
  async getBillingTrends(@Query() range: AnalyticsDateRangeQuery) {
    this.validateRange(range);
    return this.analyticsService.getBillingTrends(range.from, range.to);
  }

  @Get('subscription-breakdown')
  async getSubscriptionBreakdown() {
    return this.analyticsService.getSubscriptionBreakdown();
  }

  @Get('subscription-metrics')
  async getSubscriptionMetrics() {
    return this.analyticsService.getSubscriptionMetrics();
  }

  @Get('risks')
  async getRisks() {
    return this.analyticsService.getRisks();
  }

  @Get('renewals')
  async getRenewals(@Query() query: RenewalsQuery) {
    return this.analyticsService.getRenewals(query.days);
  }

  @Post('ask')
  async ask(@Body() body: AnalyticsQuestionDto) {
    if (!body.question.trim()) {
      throw new BadRequestException('A question is required.');
    }
    return this.analyticsService.ask(body.question);
  }

  @Post('refresh')
  @Roles(UserRole.ADMIN)
  async refresh() {
    return this.analyticsService.recalculateAll();
  }

  private validateRange(range: AnalyticsDateRangeQuery): void {
    if (range.from && range.to && new Date(range.from) > new Date(range.to)) {
      throw new BadRequestException('The from date must be before or equal to the to date.');
    }
  }
}
