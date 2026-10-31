const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Read-only sample records are available only when explicit demo mode is enabled.
const demoStore: any = {
  products: [
    {
      id: 'prod_cloud_core',
      name: 'SubFlow Cloud Core',
      type: 'service',
      salesPrice: 49.0,
      costPrice: 12.0,
      notes: 'Base subscription cloud tier with 99.9% SLA',
      status: 'active',
      variants: [
        { id: 'v1', name: '10GB Storage', additionalPrice: 0 },
        { id: 'v2', name: '50GB Storage', additionalPrice: 20 },
      ],
    },
    {
      id: 'prod_pro_analytics',
      name: 'Advanced Real-time Analytics',
      type: 'service',
      salesPrice: 29.0,
      costPrice: 5.0,
      notes: 'Real-time pipeline analytics and reporting dashboard',
      status: 'active',
      variants: [],
    },
    {
      id: 'prod_dedicated_support',
      name: '24/7 Dedicated Concierge Support',
      type: 'service',
      salesPrice: 99.0,
      costPrice: 40.0,
      notes: 'Direct slack channel with senior engineering team',
      status: 'active',
      variants: [],
    },
  ],
  plans: [
    {
      id: 'plan_starter_monthly',
      name: 'Starter Plan (Monthly)',
      description: 'Perfect for small teams getting started with recurring billing',
      basePrice: 49.0,
      billingInterval: 'monthly',
      minQuantity: 1,
      status: 'active',
      products: [{ id: 'prod_cloud_core', name: 'SubFlow Cloud Core', price: 49.0 }],
    },
    {
      id: 'plan_pro_monthly',
      name: 'Professional Plan (Monthly)',
      description: 'Comprehensive features for growing SaaS companies with analytics',
      basePrice: 78.0,
      billingInterval: 'monthly',
      minQuantity: 1,
      status: 'active',
      products: [
        { id: 'prod_cloud_core', name: 'SubFlow Cloud Core', price: 49.0 },
        { id: 'prod_pro_analytics', name: 'Advanced Real-time Analytics', price: 29.0 },
      ],
    },
  ],
  customers: [
    {
      id: 'cust_acme_corp',
      displayName: 'Acme Corporation',
      email: 'finance@acmecorp.com',
      company: 'Acme International',
      phone: '+1 (555) 234-5678',
      address: '100 Silicon Blvd, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      status: 'active',
      createdAt: '2026-10-31T05:00:00Z',
    },
    {
      id: 'cust_techstart_inc',
      displayName: 'TechStart Inc',
      email: 'billing@techstart.io',
      company: 'TechStart Labs',
      phone: '+1 (555) 876-5432',
      address: '742 Evergreen Terrace',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      status: 'active',
      createdAt: '2026-10-31T05:10:00Z',
    },
  ],
  subscriptions: [
    {
      id: 'sub_acme_pro',
      number: 'SUB-20261031-1001',
      customerId: 'cust_acme_corp',
      customerName: 'Acme Corporation',
      customerEmail: 'finance@acmecorp.com',
      planName: 'Professional Plan (Monthly)',
      billingInterval: 'monthly',
      status: 'active',
      startDate: '2026-10-31T05:00:00Z',
      nextBillingDate: '2026-11-30T05:00:00Z',
      subtotal: 78.0,
      taxAmount: 15.6,
      discountAmount: 0,
      total: 93.6,
      items: [
        { productName: 'SubFlow Cloud Core', quantity: 1, unitPrice: 49.0, total: 58.8 },
        { productName: 'Advanced Real-time Analytics', quantity: 1, unitPrice: 29.0, total: 34.8 },
      ],
      activities: [
        {
          action: 'ACTIVATED',
          description: 'Subscription activated with Professional Plan (Monthly)',
          performedByName: 'Alex Rivers (Admin)',
          createdAt: '2026-10-31T05:00:00Z',
        },
      ],
    },
    {
      id: 'sub_techstart_starter',
      number: 'SUB-20261031-1002',
      customerId: 'cust_techstart_inc',
      customerName: 'TechStart Inc',
      customerEmail: 'billing@techstart.io',
      planName: 'Starter Plan (Monthly)',
      billingInterval: 'monthly',
      status: 'active',
      startDate: '2026-10-31T05:10:00Z',
      nextBillingDate: '2026-11-30T05:10:00Z',
      subtotal: 49.0,
      taxAmount: 4.04,
      discountAmount: 9.8,
      total: 43.24,
      items: [
        { productName: 'SubFlow Cloud Core', quantity: 1, unitPrice: 49.0, total: 43.24 },
      ],
      activities: [
        {
          action: 'ACTIVATED',
          description: 'Subscription activated with Starter Plan',
          performedByName: 'Alex Rivers (Admin)',
          createdAt: '2026-10-31T05:10:00Z',
        },
      ],
    },
  ],
  invoices: [
    {
      id: 'inv_acme_oct',
      number: 'INV-20261031-0001',
      subscriptionNumber: 'SUB-20261031-1001',
      customerId: 'cust_acme_corp',
      customerName: 'Acme Corporation',
      customerEmail: 'finance@acmecorp.com',
      status: 'paid',
      issueDate: '2026-10-31T05:00:00Z',
      dueDate: '2026-11-15T05:00:00Z',
      subtotal: 78.0,
      taxAmount: 15.6,
      discountAmount: 0,
      total: 93.6,
      paidAmount: 93.6,
      outstandingAmount: 0,
      items: [
        { productName: 'SubFlow Cloud Core', quantity: 1, unitPrice: 49.0, total: 58.8 },
        { productName: 'Advanced Real-time Analytics', quantity: 1, unitPrice: 29.0, total: 34.8 },
      ],
    },
    {
      id: 'inv_techstart_oct',
      number: 'INV-20261031-0002',
      subscriptionNumber: 'SUB-20261031-1002',
      customerId: 'cust_techstart_inc',
      customerName: 'TechStart Inc',
      customerEmail: 'billing@techstart.io',
      status: 'confirmed',
      issueDate: '2026-10-31T05:10:00Z',
      dueDate: '2026-11-15T05:10:00Z',
      subtotal: 49.0,
      taxAmount: 4.04,
      discountAmount: 9.8,
      total: 43.24,
      paidAmount: 0,
      outstandingAmount: 43.24,
      items: [
        { productName: 'SubFlow Cloud Core', quantity: 1, unitPrice: 49.0, total: 43.24 },
      ],
    },
  ],
  payments: [
    {
      id: 'pay_acme_001',
      invoiceNumber: 'INV-20261031-0001',
      customerName: 'Acme Corporation',
      method: 'card',
      amount: 93.6,
      paymentDate: '2026-10-31T05:05:00Z',
      transactionRef: 'ch_3N4xZqK28xL9p1',
      notes: 'Credit Card (ending in 4242)',
    },
  ],
  taxes: [
    { id: 'tax_vat_20', name: 'Standard VAT (20%)', percentage: 20, type: 'percentage', status: 'active' },
    { id: 'tax_us_state', name: 'State Sales Tax (8.25%)', percentage: 8.25, type: 'percentage', status: 'active' },
  ],
  discounts: [
    { id: 'disc_welcome20', name: 'Welcome Special', code: 'WELCOME20', type: 'percentage', value: 20, maxUsage: 100, currentUsage: 3, status: 'active' },
    { id: 'disc_launch50', name: 'Launch Savings', code: 'LAUNCH50', type: 'fixed', value: 50, maxUsage: 50, currentUsage: 1, status: 'active' },
  ],
  quotations: [
    {
      id: 'quo_acme_expansion',
      number: 'QUO-20261031-9001',
      customerId: 'cust_acme_corp',
      customerName: 'Acme Corporation',
      customerEmail: 'finance@acmecorp.com',
      status: 'sent',
      subtotal: 128.0,
      taxAmount: 25.6,
      discountAmount: 20.0,
      total: 133.6,
      validityDays: 30,
      items: [
        { productName: 'SubFlow Cloud Core (50GB)', quantity: 1, unitPrice: 69.0, total: 69.0 },
        { productName: '24/7 Dedicated Concierge Support', quantity: 1, unitPrice: 59.0, total: 59.0 },
      ],
    },
  ],
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const demoMode =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const mockAuthEnabled =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';

async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('subflow_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers || {}) as Record<string, string>),
  };
  if (typeof window !== 'undefined' && !headers['x-correlation-id']) {
    headers['x-correlation-id'] = crypto.randomUUID();
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (mockAuthEnabled && typeof window !== 'undefined') {
    headers['x-mock-role'] = localStorage.getItem('subflow_role') || 'admin';
    headers['x-mock-uid'] = localStorage.getItem('subflow_uid') || 'demo-admin-uid';
  }

  const method = (options.method || 'GET').toUpperCase();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (
      demoMode &&
      method === 'GET' &&
      !endpoint.startsWith('/analytics')
    ) {
      return handleFallback(endpoint);
    }
    const correlationId = headers['x-correlation-id'];
    const message = correlationId
      ? `Network request failed (Correlation ID: ${correlationId}).`
      : 'Network request failed.';
    throw new ApiError(message, 0, correlationId);
  }

  if (!response.ok) {
    let responseBody: { error?: unknown; errorCode?: unknown; requestId?: unknown } = {};
    try {
      responseBody = await response.clone().json();
    } catch {
      responseBody = {};
    }
    const requestId =
      response.headers.get('x-request-id') ||
      (typeof responseBody.requestId === 'string' ? responseBody.requestId : undefined);
    const errorCode =
      typeof responseBody.errorCode === 'string' ? responseBody.errorCode : undefined;
    const responseMessage =
      typeof responseBody.error === 'string' ? responseBody.error : undefined;
    const safeMessage = responseMessage || `API request failed with status ${response.status}`;
    throw new ApiError(
      requestId ? `${safeMessage} (Request ID: ${requestId})` : safeMessage,
      response.status,
      requestId,
      errorCode,
    );
  }
  return response.json();
}

function handleFallback(endpoint: string): any {
  const path = endpoint.split('?')[0];
  if (path === '/products') {
    return demoStore.products;
  }
  if (path.startsWith('/products/')) {
    const id = path.split('/')[2];
    const product = demoStore.products.find((p: any) => p.id === id);
    if (!product) throw new Error(`No demo product found for ${id}.`);
    return product;
  }

  if (path === '/plans') {
    return demoStore.plans;
  }

  if (path === '/customers') {
    return demoStore.customers;
  }

  if (path === '/subscriptions') {
    return demoStore.subscriptions;
  }

  if (path.startsWith('/subscriptions/')) {
    const parts = path.split('/');
    const id = parts[2];
    const sub = demoStore.subscriptions.find((s: any) => s.id === id);
    if (!sub) throw new Error(`No demo subscription found for ${id}.`);
    return sub;
  }

  if (path === '/invoices') return demoStore.invoices;
  if (path.startsWith('/invoices/')) {
    const id = path.split('/')[2];
    const invoice = demoStore.invoices.find((i: any) => i.id === id);
    if (!invoice) throw new Error(`No demo invoice found for ${id}.`);
    return invoice;
  }

  if (path === '/payments') {
    return demoStore.payments;
  }

  if (path === '/quotations') return demoStore.quotations;
  if (path === '/taxes') return demoStore.taxes;
  if (path === '/discounts') return demoStore.discounts;

  throw new Error(`No read-only demo data is available for ${path}.`);
}

export const api = {
  getKpis: () => fetchFromApi('/analytics/kpis'),
  getFinancialSummary: () => fetchFromApi('/analytics/financial-summary'),
  getRevenueTrends: (range?: { from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (range?.from) params.set('from', range.from);
    if (range?.to) params.set('to', range.to);
    const query = params.toString();
    return fetchFromApi(`/analytics/revenue-trends${query ? `?${query}` : ''}`);
  },
  getBillingTrends: (range?: { from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (range?.from) params.set('from', range.from);
    if (range?.to) params.set('to', range.to);
    const query = params.toString();
    return fetchFromApi(`/analytics/billing-trends${query ? `?${query}` : ''}`);
  },
  getSubscriptionBreakdown: () => fetchFromApi('/analytics/subscription-breakdown'),
  getSubscriptionMetrics: () => fetchFromApi('/analytics/subscription-metrics'),
  getRenewals: (days = 7) =>
    fetchFromApi(`/analytics/renewals?days=${encodeURIComponent(days)}`),
  getAnalyticsRisks: () => fetchFromApi('/analytics/risks'),
  getAnalyticsInsights: () => fetchFromApi('/analytics/insights'),
  askAnalytics: (question: string) =>
    fetchFromApi('/analytics/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  // Products
  getProducts: (status?: string) => fetchFromApi(`/products${status ? `?status=${status}` : ''}`),
  getProduct: (id: string) => fetchFromApi(`/products/${id}`),
  createProduct: (data: any) => fetchFromApi('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => fetchFromApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Plans
  getPlans: (status?: string) => fetchFromApi(`/plans${status ? `?status=${status}` : ''}`),
  getPlan: (id: string) => fetchFromApi(`/plans/${id}`),
  createPlan: (data: any) => fetchFromApi('/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id: string, data: any) => fetchFromApi(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchFromApi(`/customers${query ? `?${query}` : ''}`);
  },
  getCustomer: (id: string) => fetchFromApi(`/customers/${id}`),
  createCustomer: (data: any) => fetchFromApi('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) => fetchFromApi(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Subscriptions
  getSubscriptions: (params?: { customerId?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchFromApi(`/subscriptions${query ? `?${query}` : ''}`);
  },
  getSubscription: (id: string) => fetchFromApi(`/subscriptions/${id}`),
  createSubscription: (data: any) => fetchFromApi('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  activateSubscription: (id: string) => fetchFromApi(`/subscriptions/${id}/activate`, { method: 'PATCH' }),
  pauseSubscription: (id: string) => fetchFromApi(`/subscriptions/${id}/pause`, { method: 'PATCH' }),
  resumeSubscription: (id: string) => fetchFromApi(`/subscriptions/${id}/resume`, { method: 'PATCH' }),
  cancelSubscription: (id: string, reason?: string) => fetchFromApi(`/subscriptions/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  getSubscriptionActivities: (id: string) => fetchFromApi(`/subscriptions/${id}/activities`),

  // Invoices
  getInvoices: (params?: { customerId?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchFromApi(`/invoices${query ? `?${query}` : ''}`);
  },
  getInvoice: (id: string) => fetchFromApi(`/invoices/${id}`),
  createInvoice: (data: any) => fetchFromApi('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  confirmInvoice: (id: string) => fetchFromApi(`/invoices/${id}/confirm`, { method: 'PATCH' }),

  // Payments
  getPayments: (params?: { customerId?: string; invoiceId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchFromApi(`/payments${query ? `?${query}` : ''}`);
  },
  recordPayment: (data: any) => fetchFromApi('/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Quotations
  getQuotations: () => fetchFromApi('/quotations'),
  createQuotation: (data: any) => fetchFromApi('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  sendQuotation: (id: string) => fetchFromApi(`/quotations/${id}/send`, { method: 'PATCH' }),
  acceptQuotation: (id: string) => fetchFromApi(`/quotations/${id}/accept`, { method: 'PATCH' }),

  // Taxes & Discounts
  getTaxes: () => fetchFromApi('/taxes'),
  createTax: (data: any) => fetchFromApi('/taxes', { method: 'POST', body: JSON.stringify(data) }),
  getDiscounts: () => fetchFromApi('/discounts'),
  createDiscount: (data: any) => fetchFromApi('/discounts', { method: 'POST', body: JSON.stringify(data) }),
  validateDiscount: (code: string, amount: number) => fetchFromApi(`/discounts/validate?code=${encodeURIComponent(code)}&amount=${amount}`),

  // Billing trigger
  triggerBillingRun: () => fetchFromApi('/billing/run', { method: 'POST' }),

  // Notifications
  getNotifications: () => fetchFromApi('/notifications'),
  markNotificationRead: (id: string) => fetchFromApi(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => fetchFromApi('/notifications/read-all', { method: 'PATCH' }),
};
