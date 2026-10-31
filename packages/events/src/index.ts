// ============================================================
// SubFlow — Domain Event Definitions
// All event names and payload types for the event bus
// ============================================================

import { BillingInterval, PaymentMethod } from '@subflow/shared';

// --- Event Names ---
export const EVENTS = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_PASSWORD_RESET: 'user.password.reset',

  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',

  // Product events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_ARCHIVED: 'product.archived',

  // Plan events
  PLAN_CREATED: 'plan.created',
  PLAN_UPDATED: 'plan.updated',
  PLAN_ACTIVATED: 'plan.activated',
  PLAN_DEACTIVATED: 'plan.deactivated',

  // Quotation events
  QUOTATION_CREATED: 'quotation.created',
  QUOTATION_SENT: 'quotation.sent',
  QUOTATION_ACCEPTED: 'quotation.accepted',
  QUOTATION_REJECTED: 'quotation.rejected',
  QUOTATION_EXPIRED: 'quotation.expired',

  // Subscription events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_CONFIRMED: 'subscription.confirmed',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_PAUSED: 'subscription.paused',
  SUBSCRIPTION_RESUMED: 'subscription.resumed',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_CLOSED: 'subscription.closed',

  // Billing events
  BILLING_CYCLE_TRIGGERED: 'billing.cycle.triggered',
  BILLING_CYCLE_COMPLETED: 'billing.cycle.completed',
  BILLING_CYCLE_FAILED: 'billing.cycle.failed',

  // Invoice events
  INVOICE_CREATED: 'invoice.created',
  INVOICE_CONFIRMED: 'invoice.confirmed',
  INVOICE_SENT: 'invoice.sent',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  INVOICE_CANCELLED: 'invoice.cancelled',

  // Payment events
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_PARTIAL: 'payment.partial',

  // Discount events
  DISCOUNT_EXHAUSTED: 'discount.exhausted',
  DISCOUNT_EXPIRED: 'discount.expired',

  // Analytics events
  ANALYTICS_KPI_UPDATE: 'analytics.kpi.update',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// --- Event Payloads ---
export interface UserCreatedPayload {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

export interface CustomerCreatedPayload {
  customerId: string;
  customerName: string;
  email: string;
}

export interface ProductCreatedPayload {
  productId: string;
  productName: string;
  salesPrice: number;
}

export interface PlanCreatedPayload {
  planId: string;
  planName: string;
  basePrice: number;
  billingInterval: BillingInterval;
}

export interface QuotationAcceptedPayload {
  quotationId: string;
  customerId: string;
  customerName: string;
  total: number;
}

export interface SubscriptionActivatedPayload {
  subscriptionId: string;
  customerId: string;
  customerName: string;
  planId: string;
  planName: string;
  billingInterval: BillingInterval;
  nextBillingDate: string;
  total: number;
}

export interface SubscriptionStatusChangedPayload {
  subscriptionId: string;
  customerId: string;
  previousStatus: string;
  newStatus: string;
  performedBy: string;
}

export interface BillingCycleTriggeredPayload {
  subscriptionId: string;
  billingDate: string;
}

export interface InvoiceCreatedPayload {
  invoiceId: string;
  invoiceNumber: string;
  subscriptionId: string;
  customerId: string;
  customerEmail: string;
  total: number;
  dueDate: string;
}

export interface InvoicePaidPayload {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  amount: number;
}

export interface PaymentReceivedPayload {
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  isFullPayment: boolean;
  remainingOutstanding: number;
}

export interface DiscountExhaustedPayload {
  discountId: string;
  discountCode: string;
}

// --- Event Map (for type-safe event handling) ---
export interface EventPayloadMap {
  [EVENTS.USER_CREATED]: UserCreatedPayload;
  [EVENTS.CUSTOMER_CREATED]: CustomerCreatedPayload;
  [EVENTS.PRODUCT_CREATED]: ProductCreatedPayload;
  [EVENTS.PLAN_CREATED]: PlanCreatedPayload;
  [EVENTS.QUOTATION_ACCEPTED]: QuotationAcceptedPayload;
  [EVENTS.SUBSCRIPTION_ACTIVATED]: SubscriptionActivatedPayload;
  [EVENTS.SUBSCRIPTION_CONFIRMED]: SubscriptionStatusChangedPayload;
  [EVENTS.SUBSCRIPTION_PAUSED]: SubscriptionStatusChangedPayload;
  [EVENTS.SUBSCRIPTION_RESUMED]: SubscriptionStatusChangedPayload;
  [EVENTS.SUBSCRIPTION_RENEWED]: SubscriptionActivatedPayload;
  [EVENTS.SUBSCRIPTION_CANCELLED]: SubscriptionStatusChangedPayload;
  [EVENTS.SUBSCRIPTION_CLOSED]: SubscriptionStatusChangedPayload;
  [EVENTS.BILLING_CYCLE_TRIGGERED]: BillingCycleTriggeredPayload;
  [EVENTS.INVOICE_CREATED]: InvoiceCreatedPayload;
  [EVENTS.INVOICE_PAID]: InvoicePaidPayload;
  [EVENTS.PAYMENT_RECEIVED]: PaymentReceivedPayload;
  [EVENTS.DISCOUNT_EXHAUSTED]: DiscountExhaustedPayload;
}
