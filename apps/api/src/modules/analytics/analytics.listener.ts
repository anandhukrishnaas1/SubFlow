import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsListener {
  private readonly logger = new Logger(AnalyticsListener.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @OnEvent(EVENTS.SUBSCRIPTION_ACTIVATED, { async: true })
  async handleSubscriptionActivated() {
    this.logger.log('Analytics received: SUBSCRIPTION_ACTIVATED -> updating KPIs');
    await this.analyticsService.recalculateAll();
  }

  @OnEvent(EVENTS.SUBSCRIPTION_CANCELLED, { async: true })
  async handleSubscriptionCancelled() {
    this.logger.log('Analytics received: SUBSCRIPTION_CANCELLED -> updating KPIs');
    await this.analyticsService.recalculateAll();
  }

  @OnEvent(EVENTS.INVOICE_CREATED, { async: true })
  async handleInvoiceCreated() {
    this.logger.log('Analytics received: INVOICE_CREATED -> updating KPIs');
    await this.analyticsService.recalculateAll();
  }

  @OnEvent(EVENTS.PAYMENT_RECEIVED, { async: true })
  async handlePaymentReceived() {
    this.logger.log('Analytics received: PAYMENT_RECEIVED -> updating KPIs');
    await this.analyticsService.recalculateAll();
  }

  @OnEvent(EVENTS.CUSTOMER_CREATED, { async: true })
  async handleCustomerCreated() {
    this.logger.log('Analytics received: CUSTOMER_CREATED -> updating KPIs');
    await this.analyticsService.recalculateAll();
  }
}
