// ============================================================
// SubFlow — Shared Constants
// Enums and status values used across the platform
// ============================================================

// --- User Roles ---
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  CUSTOMER = 'customer',
}

// --- Entity Statuses ---
export enum ProductStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum QuotationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum SubscriptionStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  CARD = 'card',
  ONLINE = 'online',
  OTHER = 'other',
}

export enum BillingInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum DiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

export enum TaxType {
  INCLUSIVE = 'inclusive',
  EXCLUSIVE = 'exclusive',
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

// --- Subscription Actions for Activity Log ---
export enum SubscriptionAction {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  ACTIVATED = 'activated',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  RENEWED = 'renewed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
  INVOICE_GENERATED = 'invoice_generated',
  PAYMENT_RECEIVED = 'payment_received',
}

// --- Activity Log Entity Types ---
export enum ActivityEntity {
  USER = 'user',
  CUSTOMER = 'customer',
  PRODUCT = 'product',
  PLAN = 'plan',
  QUOTATION = 'quotation',
  SUBSCRIPTION = 'subscription',
  INVOICE = 'invoice',
  PAYMENT = 'payment',
  TAX = 'tax',
  DISCOUNT = 'discount',
}

// --- Number Prefixes ---
export const NUMBER_PREFIXES = {
  QUOTATION: 'QUO',
  SUBSCRIPTION: 'SUB',
  INVOICE: 'INV',
  PAYMENT: 'PAY',
} as const;

// --- Billing Interval to Days Mapping ---
export const BILLING_INTERVAL_DAYS: Record<BillingInterval, number> = {
  [BillingInterval.DAILY]: 1,
  [BillingInterval.WEEKLY]: 7,
  [BillingInterval.MONTHLY]: 30,
  [BillingInterval.YEARLY]: 365,
};
