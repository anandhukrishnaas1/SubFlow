import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(EVENTS.SUBSCRIPTION_ACTIVATED, { async: true })
  async handleSubscriptionActivated(payload: any) {
    if (payload.customerId) {
      await this.notificationService.send(payload.customerId, {
        title: 'Subscription Activated! 🎉',
        message: `Your subscription to ${payload.planName || 'SubFlow'} is now active. Next billing date: ${payload.nextBillingDate ? new Date(payload.nextBillingDate).toLocaleDateString() : 'N/A'}.`,
        type: 'success',
      });
    }
  }

  @OnEvent(EVENTS.INVOICE_CREATED, { async: true })
  async handleInvoiceCreated(payload: any) {
    if (payload.customerId) {
      await this.notificationService.send(payload.customerId, {
        title: 'New Invoice Issued',
        message: `Invoice #${payload.invoiceNumber} for $${Number(payload.total).toFixed(2)} has been generated. Due date: ${new Date(payload.dueDate).toLocaleDateString()}.`,
        type: 'info',
      });
    }
  }

  @OnEvent(EVENTS.PAYMENT_RECEIVED, { async: true })
  async handlePaymentReceived(payload: any) {
    if (payload.customerId) {
      await this.notificationService.send(payload.customerId, {
        title: 'Payment Received ✔',
        message: `Payment of $${Number(payload.amount).toFixed(2)} for Invoice #${payload.invoiceNumber} was successfully processed.`,
        type: 'success',
      });
    }
  }
}
