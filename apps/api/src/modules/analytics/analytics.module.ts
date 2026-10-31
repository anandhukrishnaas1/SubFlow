import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsCopilotService } from './analytics-copilot.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsCopilotService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
