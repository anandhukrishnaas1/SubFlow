const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// In-memory demo store fallback if API server is not running
let demoStore: any = {
  kpis: {
    totalCustomers: 3,
    activeSubscriptions: 2,
    mrr: 121.24,
    arr: 1454.88,
    totalRevenue: 93.6,
    outstandingPayments: 43.24,
    overdueInvoices: 0,
    upcomingRenewals: 2,
  },
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

async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('subflow_token') || 'demo-admin-token' : 'demo-admin-token';
  const role = typeof window !== 'undefined' ? localStorage.getItem('subflow_role') || 'admin' : 'admin';
  const uid = typeof window !== 'undefined' ? localStorage.getItem('subflow_uid') || 'demo-admin-uid' : 'demo-admin-uid';

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-mock-role': role,
    'x-mock-uid': uid,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    // Graceful fallback to demoStore if backend server is not running
    console.info(`[SubFlow Client] Backend not reachable on ${endpoint}, serving from client cache:`, err);
    return handleFallback(endpoint, options);
  }
}

function handleFallback(endpoint: string, options: RequestInit = {}): any {
  const path = endpoint.split('?')[0];
  const method = (options.method || 'GET').toUpperCase();

  if (path === '/analytics/kpis') return demoStore.kpis;
  if (path === '/products') {
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const item = { id: `prod_${Date.now()}`, ...body, status: 'active', variants: body.variants || [] };
      demoStore.products.unshift(item);
      return item;
    }
    return demoStore.products;
  }
  if (path.startsWith('/products/')) {
    const id = path.split('/')[2];
    return demoStore.products.find((p: any) => p.id === id) || demoStore.products[0];
  }

  if (path === '/plans') {
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const item = { id: `plan_${Date.now()}`, ...body, status: 'active' };
      demoStore.plans.unshift(item);
      return item;
    }
    return demoStore.plans;
  }

  if (path === '/customers') {
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const item = { id: `cust_${Date.now()}`, ...body, status: 'active', createdAt: new Date().toISOString() };
      demoStore.customers.unshift(item);
      demoStore.kpis.totalCustomers += 1;
      return item;
    }
    return demoStore.customers;
  }

  if (path === '/subscriptions') {
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const item = {
        id: `sub_${Date.now()}`,
        number: `SUB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'active',
        startDate: new Date().toISOString(),
        ...body,
      };
      demoStore.subscriptions.unshift(item);
      demoStore.kpis.activeSubscriptions += 1;
      demoStore.kpis.mrr += Number(item.total) || 0;
      return item;
    }
    return demoStore.subscriptions;
  }

  if (path.startsWith('/subscriptions/')) {
    const parts = path.split('/');
    const id = parts[2];
    const action = parts[3];
    const sub = demoStore.subscriptions.find((s: any) => s.id === id);
    if (sub && action) {
      if (action === 'activate') sub.status = 'active';
      if (action === 'pause') sub.status = 'paused';
      if (action === 'cancel') sub.status = 'cancelled';
      if (action === 'confirm') sub.status = 'confirmed';
      return sub;
    }
    return sub || demoStore.subscriptions[0];
  }

  if (path === '/invoices') return demoStore.invoices;
  if (path.startsWith('/invoices/')) {
    const id = path.split('/')[2];
    return demoStore.invoices.find((i: any) => i.id === id) || demoStore.invoices[0];
  }

  if (path === '/payments') {
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const item = { id: `pay_${Date.now()}`, ...body, paymentDate: new Date().toISOString() };
      demoStore.payments.unshift(item);
      demoStore.kpis.totalRevenue += Number(item.amount) || 0;
      demoStore.kpis.outstandingPayments = Math.max(0, demoStore.kpis.outstandingPayments - Number(item.amount));
      return item;
    }
    return demoStore.payments;
  }

  if (path === '/quotations') return demoStore.quotations;
  if (path === '/taxes') return demoStore.taxes;
  if (path === '/discounts') return demoStore.discounts;

  return [];
}

export const api = {
  getKpis: () => fetchFromApi('/analytics/kpis'),
  getRevenueTrends: () => fetchFromApi('/analytics/revenue-trends'),
  getSubscriptionBreakdown: () => fetchFromApi('/analytics/subscription-breakdown'),

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
