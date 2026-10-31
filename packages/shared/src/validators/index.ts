// ============================================================
// SubFlow — Zod Validators
// Shared validation schemas used by both frontend and backend
// ============================================================

import { z } from 'zod';
import {
  UserRole,
  ProductStatus,
  PlanStatus,
  BillingInterval,
  QuotationStatus,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethod,
  DiscountType,
  TaxType,
} from '../constants';

// --- Auth Validators ---
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.CUSTOMER),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// --- User Profile Validators ---
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

// --- Product Validators ---
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.string().min(1, 'Product type is required'),
  salesPrice: z.number().min(0, 'Sales price must be positive'),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  notes: z.string().optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1, 'Variant name is required'),
        additionalPrice: z.number().min(0, 'Additional price must be positive'),
      })
    )
    .optional()
    .default([]),
});

export const updateProductSchema = createProductSchema.partial();

// --- Plan Validators ---
export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().min(1, 'Description is required'),
  basePrice: z.number().min(0, 'Base price must be positive'),
  billingInterval: z.nativeEnum(BillingInterval),
  minQuantity: z.number().int().min(1).default(1),
  availableFrom: z.string().or(z.date()),
  availableUntil: z.string().or(z.date()).optional().nullable(),
  autoClose: z.boolean().default(false),
  allowCancel: z.boolean().default(true),
  allowPause: z.boolean().default(true),
  allowRenewal: z.boolean().default(true),
  productIds: z.array(z.string()).min(1, 'At least one product is required'),
});

export const updatePlanSchema = createPlanSchema.partial();

// --- Tax Validators ---
export const createTaxSchema = z.object({
  name: z.string().min(1, 'Tax name is required'),
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  type: z.nativeEnum(TaxType),
  applicableProductIds: z.array(z.string()).default([]),
});

export const updateTaxSchema = createTaxSchema.partial();

// --- Discount Validators ---
export const createDiscountSchema = z.object({
  name: z.string().min(1, 'Discount name is required'),
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric'),
  type: z.nativeEnum(DiscountType),
  value: z.number().min(0, 'Value must be positive'),
  minPurchase: z.number().min(0).default(0),
  minQuantity: z.number().int().min(0).default(0),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  maxUsage: z.number().int().min(0).default(0),
  applicableProductIds: z.array(z.string()).default([]),
  appliesToEntireSubscription: z.boolean().default(false),
});

export const updateDiscountSchema = createDiscountSchema.partial();

// --- Quotation Validators ---
export const createQuotationSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  validityDays: z.number().int().min(1).default(30),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, 'At least one item is required'),
});

// --- Subscription Validators ---
export const createSubscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  planId: z.string().min(1, 'Plan is required'),
  startDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()).optional().nullable(),
  paymentTerms: z.number().int().min(0).default(30),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, 'At least one item is required'),
});

// --- Payment Validators ---
export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().min(0.01, 'Amount must be greater than zero'),
  paymentDate: z.string().or(z.date()),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

// --- Inferred Types ---
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
