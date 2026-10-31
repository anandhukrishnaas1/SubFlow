// ============================================================
// SubFlow — Shared TypeScript Types
// Firestore document types used across the platform
// ============================================================

import {
  UserRole,
  ProductStatus,
  PlanStatus,
  QuotationStatus,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethod,
  BillingInterval,
  DiscountType,
  TaxType,
  NotificationType,
  SubscriptionAction,
  ActivityEntity,
} from '../constants';

// --- Firestore Timestamp Helper ---
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export type Timestamp = FirestoreTimestamp | Date | string;

// --- Base Document ---
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// --- User / Customer ---
export interface UserProfile extends BaseDocument {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  notes?: string;
  status: 'active' | 'inactive';
  deletedAt?: Timestamp | null;
}

// --- Product ---
export interface Product extends BaseDocument {
  name: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  notes?: string;
  status: ProductStatus;
  deletedAt?: Timestamp | null;
}

export interface ProductVariant {
  id: string;
  name: string;
  additionalPrice: number;
  createdAt: Timestamp;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

// --- Plan ---
export interface Plan extends BaseDocument {
  name: string;
  description: string;
  basePrice: number;
  billingInterval: BillingInterval;
  minQuantity: number;
  availableFrom: Timestamp;
  availableUntil?: Timestamp | null;
  autoClose: boolean;
  allowCancel: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  status: PlanStatus;
  productIds: string[];
  products: Array<{ id: string; name: string; price: number }>;
}

// --- Tax ---
export interface Tax extends BaseDocument {
  name: string;
  percentage: number;
  type: TaxType;
  status: 'active' | 'inactive';
  applicableProductIds: string[];
}

// --- Discount ---
export interface Discount extends BaseDocument {
  name: string;
  code: string;
  type: DiscountType;
  value: number;
  minPurchase: number;
  minQuantity: number;
  startDate: Timestamp;
  endDate: Timestamp;
  maxUsage: number;
  currentUsage: number;
  applicableProductIds: string[];
  appliesToEntireSubscription: boolean;
  status: 'active' | 'inactive';
}

// --- Tax & Discount Snapshot (embedded in line items) ---
export interface TaxSnapshot {
  taxId: string;
  name: string;
  percentage: number;
  type: TaxType;
  amount: number;
}

export interface DiscountSnapshot {
  discountId: string;
  name: string;
  code: string;
  type: DiscountType;
  value: number;
  amount: number;
}

// --- Line Item (used in quotations, subscriptions, invoices) ---
export interface LineItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  taxes: TaxSnapshot[];
  discounts: DiscountSnapshot[];
}

// --- Quotation ---
export interface Quotation extends BaseDocument {
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  validityDays: number;
  expiresAt: Timestamp;
  status: QuotationStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  createdBy: string;
  createdByName: string;
}

export interface QuotationWithItems extends Quotation {
  items: LineItem[];
}

// --- Subscription ---
export interface Subscription extends BaseDocument {
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  billingInterval: BillingInterval;
  quotationId?: string | null;
  status: SubscriptionStatus;
  startDate: Timestamp;
  expiryDate?: Timestamp | null;
  nextBillingDate: Timestamp;
  paymentTerms: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  createdBy: string;
  createdByName: string;
}

export interface SubscriptionWithItems extends Subscription {
  items: LineItem[];
}

export interface SubscriptionActivity {
  id: string;
  action: SubscriptionAction;
  description: string;
  performedBy: string;
  performedByName: string;
  createdAt: Timestamp;
}

// --- Invoice ---
export interface Invoice extends BaseDocument {
  number: string;
  subscriptionId: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: InvoiceStatus;
  issueDate: Timestamp;
  dueDate: Timestamp;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  billingPeriodStart: Timestamp;
  billingPeriodEnd: Timestamp;
  pdfUrl?: string;
  sentAt?: Timestamp | null;
  paidAt?: Timestamp | null;
  idempotencyKey: string;
}

export interface InvoiceWithItems extends Invoice {
  items: LineItem[];
}

// --- Payment ---
export interface Payment extends BaseDocument {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  method: PaymentMethod;
  amount: number;
  paymentDate: Timestamp;
  transactionRef?: string;
  notes?: string;
}

// --- Notification ---
export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: NotificationType;
  entityType?: ActivityEntity;
  entityId?: string;
  createdAt: Timestamp;
}

// --- Activity Log ---
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: ActivityEntity;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

// --- Analytics Counters ---
export interface AnalyticsCounters {
  totalCustomers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  mrr: number;
  arr: number;
  outstandingPayments: number;
  overdueInvoices: number;
  upcomingRenewals: number;
  lastUpdated: Timestamp;
}

// --- Monthly Analytics ---
export interface MonthlyAnalytics {
  month: string; // YYYY-MM
  revenue: number;
  collected: number;
  outstanding: number;
  newSubscriptions: number;
  cancelled: number;
  active: number;
  invoicesGenerated: number;
  invoicesPaid: number;
  byProduct: Record<string, number>;
}

// --- API Response Types ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  lastDocId?: string;
}

// --- Dashboard Types ---
export interface DashboardKPI {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: string;
}

export interface RecentActivity {
  id: string;
  type: ActivityEntity;
  description: string;
  timestamp: Timestamp;
  user?: string;
}
