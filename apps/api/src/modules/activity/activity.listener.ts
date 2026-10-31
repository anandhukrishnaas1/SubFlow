import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { ActivityService } from './activity.service';

@Injectable()
export class ActivityListener {
  constructor(private readonly activityService: ActivityService) {}

  @OnEvent(EVENTS.SUBSCRIPTION_ACTIVATED, { async: true })
  async onSubActivated(payload: any) {
    await this.activityService.log({
      action: 'SUBSCRIPTION_ACTIVATED',
      entity: 'subscription',
      entityId: payload.subscriptionId,
      description: `Subscription activated for ${payload.customerName} on ${payload.planName}`,
      metadata: payload,
    });
  }

  @OnEvent(EVENTS.SUBSCRIPTION_CANCELLED, { async: true })
  async onSubCancelled(payload: any) {
    await this.activityService.log({
      action: 'SUBSCRIPTION_CANCELLED',
      entity: 'subscription',
      entityId: payload.subscriptionId,
      description: `Subscription was cancelled`,
      metadata: payload,
    });
  }

  @OnEvent(EVENTS.INVOICE_CREATED, { async: true })
  async onInvoiceCreated(payload: any) {
    await this.activityService.log({
      action: 'INVOICE_CREATED',
      entity: 'invoice',
      entityId: payload.invoiceId,
      description: `Invoice #${payload.invoiceNumber} created for $${payload.total}`,
      metadata: payload,
    });
  }

  @OnEvent(EVENTS.PAYMENT_RECEIVED, { async: true })
  async onPaymentReceived(payload: any) {
    await this.activityService.log({
      action: 'PAYMENT_RECEIVED',
      entity: 'payment',
      entityId: payload.paymentId,
      description: `Payment of $${payload.amount} received via ${payload.method}`,
      metadata: payload,
    });
  }
}
