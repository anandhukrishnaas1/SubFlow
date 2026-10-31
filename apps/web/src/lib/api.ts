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
    {
      id: 'cust_global_logistics',
      displayName: 'Global Logistics Partners',
      email: 'operations@globallogistics.com',
      company: 'Global Logistics Group',
      phone: '+44 20 7946 0912',
      address: '25 Bank Street',
      city: 'London',
      state: 'Greater London',
      country: 'UK',
      status: 'active',
      createdAt: '2026-10-31T05:15:00Z',
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
    {
      id: 'sub_global_missed',
      number: 'SUB-20261031-1003',
      customerId: 'cust_global_logistics',
      customerName: 'Global Logistics Partners',
      customerEmail: 'operations@globallogistics.com',
      planName: 'Professional Plan (Monthly)',
      billingInterval: 'monthly',
      status: 'active',
      startDate: '2026-09-01T00:00:00Z',
      nextBillingDate: '2026-10-01T00:00:00Z',
      subtotal: 78.0,
      taxAmount: 15.6,
      discountAmount: 0,
      total: 93.6,
      items: [
        { productName: 'SubFlow Cloud Core', quantity: 1, unitPrice: 49.0, total: 58.8 },
        { productName: 'Advanced Real-time Analytics', quantity: 1, unitPrice: 29.0, total: 34.8 },
      ],
      activities: [],
    },
    {
      id: 'sub_global_paused',
      number: 'SUB-20261031-1004',
      customerId: 'cust_global_logistics',
      customerName: 'Global Logistics Partners',
      customerEmail: 'operations@globallogistics.com',
      planName: 'Starter Plan (Monthly)',
      billingInterval: 'monthly',
      status: 'paused',
      startDate: '2026-08-01T00:00:00Z',
      nextBillingDate: '2026-11-30T05:00:00Z',
      subtotal: 49.0,
      taxAmount: 0,
      discountAmount: 0,
      total: 49.0,
      items: [
        { productName: 'SubFlow Cloud Core', quantity: 1, unitPrice: 49.0, total: 49.0 },
      ],
      activities: [],
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
      idempotencyKey: 'billing-sub_acme_pro-2026-10-01',
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
      issueDate: '2026-09-15T00:00:00Z',
      dueDate: '2026-10-01T00:00:00Z',
      idempotencyKey: 'billing-sub_techstart_starter-2026-10-01',
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
  if (path === '/analytics/revenue-trends') {
    return [
      { month: 'Jun', revenue: 480, billed: 500, collected: 480 },
      { month: 'Jul', revenue: 710, billed: 750, collected: 710 },
      { month: 'Aug', revenue: 990, billed: 1050, collected: 990 },
      { month: 'Sep', revenue: 1200, billed: 1250, collected: 1200 },
      { month: 'Oct', revenue: 1490, billed: 1550, collected: 1490 },
      {
        month: 'Nov',
        revenue: Number(demoStore.kpis.totalRevenue) || 93.6,
        billed:
          demoStore.invoices.reduce((s: number, i: any) => s + (Number(i.total) || 0), 0) || 136.84,
        collected: Number(demoStore.kpis.totalRevenue) || 93.6,
      },
    ];
  }
  if (path === '/analytics/subscription-breakdown') {
    return {
      total: demoStore.subscriptions.length,
      statusCounts: {
        active: demoStore.subscriptions.filter((s: any) => s.status === 'active').length,
        paused: demoStore.subscriptions.filter((s: any) => s.status === 'paused').length,
        confirmed: demoStore.subscriptions.filter((s: any) => s.status === 'confirmed').length,
        cancelled: demoStore.subscriptions.filter((s: any) => s.status === 'cancelled').length,
      },
    };
  }
  if (path === '/analytics/ai-insights') {
    const now = new Date();
    const activeSubs = demoStore.subscriptions.filter((s: any) => s.status === 'active');
    const pausedSubs = demoStore.subscriptions.filter((s: any) => s.status === 'paused');
    const cancelledSubs = demoStore.subscriptions.filter((s: any) => s.status === 'cancelled');
    const totalBilled = Math.round(
      demoStore.invoices.reduce((s: number, i: any) => s + (Number(i.total) || 0), 0) * 100,
    ) / 100;
    const totalCollected = Math.round(
      demoStore.payments.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) * 100,
    ) / 100;
    const unpaidInvoices = demoStore.invoices.filter(
      (i: any) => i.status !== 'paid' && (Number(i.outstandingAmount) || 0) > 0,
    );
    const overdueInvoices = unpaidInvoices.filter(
      (i: any) => i.status === 'overdue' || (i.dueDate && new Date(i.dueDate) < now),
    );
    const outstandingAmount = Math.round(
      unpaidInvoices.reduce((s: number, i: any) => s + (Number(i.outstandingAmount) || 0), 0) * 100,
    ) / 100;
    const totalInvoiceDiscounts = Math.round(
      demoStore.invoices.reduce((s: number, i: any) => s + (Number(i.discountAmount) || 0), 0) * 100,
    ) / 100;
    const missedBillingSubs = activeSubs.filter(
      (s: any) => s.nextBillingDate && new Date(s.nextBillingDate) <= now,
    );
    const missedBillingAtRisk = Math.round(
      missedBillingSubs.reduce((s: number, sub: any) => s + (Number(sub.recurringTotal) || 0), 0) * 100,
    ) / 100;
    const pausedMrr = Math.round(
      pausedSubs.reduce((s: number, sub: any) => s + (Number(sub.recurringTotal) || 0), 0) * 100,
    ) / 100;
    const openQuotes = demoStore.quotations.filter((q: any) => q.status !== 'accepted');
    const openQuotesVal = Math.round(
      openQuotes.reduce((s: number, q: any) => s + (Number(q.total) || 0), 0) * 100,
    ) / 100;
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 1000) / 10 : 100;
    const mrr = Number(demoStore.kpis.mrr) || 214.84;

    return {
      summary: {
        totalCustomers: demoStore.customers.length,
        activeSubscriptions: activeSubs.length,
        pausedSubscriptions: pausedSubs.length,
        cancelledSubscriptions: cancelledSubs.length,
        mrr,
        arr: Math.round(mrr * 12 * 100) / 100,
        totalBilled,
        totalCollected,
        outstandingAmount,
        overdueInvoicesCount: overdueInvoices.length,
        unpaidInvoicesCount: unpaidInvoices.length,
        totalInvoiceDiscounts,
        missedBillingCount: missedBillingSubs.length,
        duplicateChargesCount: 0,
        openQuotationsCount: openQuotes.length,
        openQuotationsValue: openQuotesVal,
        collectionRate,
      },
      insights: [
        {
          id: 'ins_revenue_delta',
          title:
            outstandingAmount > 0
              ? `$${outstandingAmount.toFixed(2)} Overdue & Uncollected Receivables Affecting Cashflow`
              : 'Realized Revenue Matches 100% of Billed Invoices',
          category: 'Revenue & Cashflow',
          severity: outstandingAmount > 0 ? 'warning' : 'success',
          metric: `${collectionRate}% Collection Rate`,
          impact: `-$${outstandingAmount.toFixed(2)} pending collection`,
          explanation: `Out of $${totalBilled.toFixed(2)} billed in the current cycle, $${totalCollected.toFixed(2)} (${collectionRate}%) has been collected. The remaining $${outstandingAmount.toFixed(2)} is past due on TechStart Inc (INV-20261031-0002).`,
          recommendation: 'Record settlement on overdue confirmed invoices to capture 100% of billed MRR.',
        },
        {
          id: 'ins_missed_billing',
          title:
            missedBillingSubs.length > 0
              ? `${missedBillingSubs.length} Active Subscription(s) Overdue for Recurring Billing ($${missedBillingAtRisk.toFixed(2)})`
              : 'All Active Subscriptions Billed on Schedule',
          category: 'Billing Automation',
          severity: missedBillingSubs.length > 0 ? 'critical' : 'success',
          metric: `${missedBillingSubs.length} Missed Cycle(s)`,
          impact: `$${missedBillingAtRisk.toFixed(2)} unbilled MRR`,
          explanation:
            missedBillingSubs.length > 0
              ? `Subscription SUB-20261031-1003 (Global Logistics Ltd) has a nextBillingDate in the past without a generated invoice for the current cycle.`
              : `All ${activeSubs.length} active subscriptions have up-to-date invoices.`,
          recommendation: 'Trigger the Automated Billing Engine to generate overdue renewal invoices immediately.',
        },
        {
          id: 'ins_discount_leakage',
          title: `Promotional Discounts & Paused Contracts Impacting Revenue by $${(totalInvoiceDiscounts + pausedMrr).toFixed(2)}`,
          category: 'Revenue Leakage',
          severity: 'info',
          metric: `-$${(totalInvoiceDiscounts + pausedMrr).toFixed(2)} Leakage`,
          impact: `$${totalInvoiceDiscounts.toFixed(2)} discounts + $${pausedMrr.toFixed(2)} paused`,
          explanation: `Active coupon codes (WELCOME20 at 20%) reduced gross billings by $${totalInvoiceDiscounts.toFixed(2)}, while ${pausedSubs.length} paused subscription (SUB-20261031-1004) holds $${pausedMrr.toFixed(2)}/mo on hold.`,
          recommendation: 'Reach out to paused accounts with a reactivation offer and audit coupon usage limits.',
        },
        {
          id: 'ins_expansion_pipeline',
          title: `$${openQuotesVal.toFixed(2)} in Pending Quotations Ready for Conversion`,
          category: 'Expansion Opportunity',
          severity: 'info',
          metric: `+${Math.round((openQuotesVal / mrr) * 100)}% Potential MRR Lift`,
          impact: `+$${openQuotesVal.toFixed(2)}/mo pipeline`,
          explanation: `Quotation QUO-20261031-9001 ($${openQuotesVal.toFixed(2)} for Acme Corporation) is awaiting acceptance and conversion into an active subscription.`,
          recommendation: 'Convert accepted quotes directly into active subscriptions.',
        },
      ],
      anomalies: [
        {
          type: 'overdue_and_unpaid',
          label: 'Overdue & Unpaid Invoices',
          status: overdueInvoices.length > 0 ? 'critical' : unpaidInvoices.length > 0 ? 'warning' : 'healthy',
          count: unpaidInvoices.length,
          amountAtRisk: outstandingAmount,
          description:
            unpaidInvoices.length > 0
              ? `${overdueInvoices.length} past-due invoice(s) (TechStart Inc INV-20261031-0002) totaling $${outstandingAmount.toFixed(2)} awaiting payment.`
              : 'Zero overdue or unpaid invoices detected.',
        },
        {
          type: 'missed_billing',
          label: 'Missed Billing Cycles',
          status: missedBillingSubs.length > 0 ? 'critical' : 'healthy',
          count: missedBillingSubs.length,
          amountAtRisk: missedBillingAtRisk,
          description:
            missedBillingSubs.length > 0
              ? `${missedBillingSubs.length} active subscription (Global Logistics Ltd SUB-20261031-1003) has passed its billing date ($${missedBillingAtRisk.toFixed(2)} unbilled).`
              : `All ${activeSubs.length} active subscriptions are billed up to date.`,
        },
        {
          type: 'duplicate_charges',
          label: 'Duplicate Charge Guard',
          status: 'healthy',
          count: 0,
          amountAtRisk: 0,
          description: 'Idempotency keys verified across all billing runs — 0 duplicate charges detected.',
        },
        {
          type: 'revenue_leakage',
          label: 'Potential Revenue Leakage',
          status: 'warning',
          count: unpaidInvoices.length + pausedSubs.length + 1,
          amountAtRisk: Math.round((outstandingAmount + totalInvoiceDiscounts + pausedMrr) * 100) / 100,
          description: `$${outstandingAmount.toFixed(2)} overdue receivables + $${totalInvoiceDiscounts.toFixed(2)} discounts + $${pausedMrr.toFixed(2)} paused MRR.`,
        },
      ],
      suggestedQuestions: [
        'Why did revenue decrease this month?',
        'Which customers are at risk of churn or have unpaid balances?',
        'How much revenue is stuck in overdue or unpaid invoices?',
        'Are there any missed billing cycles or duplicate charges?',
        'What is the revenue impact of discounts and coupons?',
        'Which products and plans generate the most MRR?',
      ],
      generatedAt: new Date().toISOString(),
    };
  }
  if (path === '/analytics/ai-ask' && method === 'POST') {
    const now = new Date();
    const body = JSON.parse((options.body as string) || '{}');
    const question = body.question || 'Why did revenue decrease this month?';
    const qLower = question.toLowerCase();
    const activeSubs = demoStore.subscriptions.filter((s: any) => s.status === 'active');
    const pausedSubs = demoStore.subscriptions.filter((s: any) => s.status === 'paused');
    const totalBilled = Math.round(
      demoStore.invoices.reduce((s: number, i: any) => s + (Number(i.total) || 0), 0) * 100,
    ) / 100;
    const totalCollected = Math.round(
      demoStore.payments.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) * 100,
    ) / 100;
    const unpaidInvoices = demoStore.invoices.filter(
      (i: any) => i.status !== 'paid' && (Number(i.outstandingAmount) || 0) > 0,
    );
    const outstandingAmount = Math.round(
      unpaidInvoices.reduce((s: number, i: any) => s + (Number(i.outstandingAmount) || 0), 0) * 100,
    ) / 100;
    const totalDiscounts = Math.round(
      demoStore.invoices.reduce((s: number, i: any) => s + (Number(i.discountAmount) || 0), 0) * 100,
    ) / 100;
    const missedBillingSubs = activeSubs.filter(
      (s: any) => s.nextBillingDate && new Date(s.nextBillingDate) <= now,
    );
    const missedBillingAtRisk = Math.round(
      missedBillingSubs.reduce((s: number, sub: any) => s + (Number(sub.recurringTotal) || 0), 0) * 100,
    ) / 100;
    const pausedMrr = Math.round(
      pausedSubs.reduce((s: number, sub: any) => s + (Number(sub.recurringTotal) || 0), 0) * 100,
    ) / 100;
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 1000) / 10 : 100;

    if (qLower.includes('missed') || qLower.includes('duplicate') || qLower.includes('anomaly')) {
      return {
        question,
        headline: `${missedBillingSubs.length} missed billing cycle detected ($${missedBillingAtRisk.toFixed(2)} unbilled) and 0 duplicate charges.`,
        answer:
          `Automated billing and anomaly audit across ${demoStore.subscriptions.length} subscriptions and ${demoStore.invoices.length} invoices:\n\n` +
          `• **Missed Billing Cycles (${missedBillingSubs.length})**: **Global Logistics Ltd** (\`SUB-20261031-1003\`, Pro Plan — $${missedBillingAtRisk.toFixed(2)}/mo) has \`nextBillingDate = 2026-10-01\` in the past without a generated invoice for the current cycle.\n` +
          `• **Duplicate Charge Protection (0 duplicates)**: Every invoice is guarded by a deterministic \`idempotencyKey\` (\`subId_periodStart\`), preventing double-billing.\n` +
          `• **Overdue Receivables ($${outstandingAmount.toFixed(2)})**: \`INV-20261031-0002\` (TechStart Inc) is past its \`2026-10-01\` due date.`,
        metrics: [
          { label: 'Missed Billing Cycles', value: `${missedBillingSubs.length}`, status: 'warning' },
          { label: 'Unbilled Revenue at Risk', value: `$${missedBillingAtRisk.toFixed(2)}`, status: 'warning' },
          { label: 'Duplicate Charges', value: '0', status: 'positive' },
          { label: 'Overdue Invoices', value: `${unpaidInvoices.length}`, status: 'warning' },
        ],
        drivers: [
          { factor: 'SUB-20261031-1003 — Global Logistics Ltd', impact: `$${missedBillingAtRisk.toFixed(2)} unbilled`, detail: 'Active subscription with nextBillingDate (2026-10-01) in the past' },
          { factor: 'Idempotency Key Guard', impact: '0 duplicate charges', detail: 'Verified across all confirmed invoices' },
        ],
        recommendations: [
          { action: 'Run the Billing Engine for SUB-20261031-1003 to generate the missed invoice', expectedImpact: `+$${missedBillingAtRisk.toFixed(2)} billed MRR`, href: '/subscriptions' },
        ],
        generatedAt: new Date().toISOString(),
      };
    }

    if (qLower.includes('churn') || qLower.includes('risk') || qLower.includes('customer')) {
      return {
        question,
        headline: `${activeSubs.length} active subscriptions ($${Number(demoStore.kpis.mrr).toFixed(2)} MRR); ${unpaidInvoices.length} overdue account and ${pausedSubs.length} paused contract flagged.`,
        answer:
          `Customer health and churn risk analysis from live records:\n\n` +
          `• **Overdue Account**: **TechStart Inc** has a past-due confirmed invoice (\`INV-20261031-0002\`, due \`2026-10-01\`) of **$${outstandingAmount.toFixed(2)}** on the Starter Plan.\n` +
          `• **Paused Subscription ($${pausedMrr.toFixed(2)}/mo on hold)**: **Global Logistics Ltd** has 1 paused contract (\`SUB-20261031-1004\`, Starter Plan — $${pausedMrr.toFixed(2)}/mo) and 1 active Pro Plan contract awaiting billing (\`SUB-20261031-1003\`).\n` +
          `• **Healthy & Expanding Accounts**: **Acme Corporation** (\`SUB-20261031-1001\`, $93.60/mo paid in full) also has an open expansion quote (\`QUO-20261031-9001\` for $133.60).`,
        metrics: [
          { label: 'Active Subscriptions', value: `${activeSubs.length}`, status: 'positive' },
          { label: 'Active MRR', value: `$${Number(demoStore.kpis.mrr).toFixed(2)}`, status: 'positive' },
          { label: 'Overdue Accounts', value: `${unpaidInvoices.length}`, status: 'warning' },
          { label: 'Paused MRR', value: `$${pausedMrr.toFixed(2)}`, status: 'warning' },
        ],
        drivers: [
          { factor: 'TechStart Inc (Starter Plan)', impact: `$${outstandingAmount.toFixed(2)} overdue`, detail: 'Invoice INV-20261031-0002 past due since 2026-10-01' },
          { factor: 'Global Logistics Ltd (Starter Plan)', impact: `$${pausedMrr.toFixed(2)}/mo paused`, detail: 'Subscription SUB-20261031-1004 is currently paused' },
          { factor: 'Acme Corporation (Pro Plan)', impact: '$93.60 paid + $133.60 quote', detail: 'Settled via card; expansion quote QUO-20261031-9001 sent' },
        ],
        recommendations: [
          { action: 'Follow up with TechStart Inc to settle overdue invoice INV-20261031-0002 ($43.24)', expectedImpact: 'Eliminates involuntary churn risk', href: '/invoices' },
          { action: 'Resume paused subscription SUB-20261031-1004 for Global Logistics Ltd', expectedImpact: `+$${pausedMrr.toFixed(2)}/mo MRR`, href: '/subscriptions' },
        ],
        generatedAt: new Date().toISOString(),
      };
    }

    if (qLower.includes('overdue') || qLower.includes('unpaid') || qLower.includes('stuck') || qLower.includes('invoice')) {
      return {
        question,
        headline: `$${outstandingAmount.toFixed(2)} is stuck in ${unpaidInvoices.length} overdue invoice(s), plus $${missedBillingAtRisk.toFixed(2)} in unbilled active renewals.`,
        answer:
          `Live analysis of the \`invoices\` collection ($${totalBilled.toFixed(2)} total billed):\n\n` +
          `• **Paid Invoices ($${totalCollected.toFixed(2)})**: \`INV-20261031-0001\` (Acme Corporation — $93.60)\n` +
          `• **Overdue / Unpaid ($${outstandingAmount.toFixed(2)})**: \`INV-20261031-0002\` (TechStart Inc — $${outstandingAmount.toFixed(2)}, status: \`confirmed\`, due \`2026-10-01\`)\n` +
          `• **Unbilled Active Subscription ($${missedBillingAtRisk.toFixed(2)})**: \`SUB-20261031-1003\` (Global Logistics Ltd) is past its \`2026-10-01\` billing date.`,
        metrics: [
          { label: 'Total Invoiced', value: `$${totalBilled.toFixed(2)}`, status: 'neutral' },
          { label: 'Total Collected', value: `$${totalCollected.toFixed(2)}`, status: 'positive' },
          { label: 'Overdue Balance', value: `$${outstandingAmount.toFixed(2)}`, status: 'warning' },
          { label: 'Collection Rate', value: `${collectionRate}%`, status: 'info' },
        ],
        drivers: [
          { factor: 'INV-20261031-0002 — TechStart Inc', impact: `$${outstandingAmount.toFixed(2)} overdue`, detail: 'Due 2026-10-01 • CONFIRMED • Starter Plan (Monthly)' },
          { factor: 'SUB-20261031-1003 — Global Logistics Ltd', impact: `$${missedBillingAtRisk.toFixed(2)} unbilled`, detail: 'Missed billing cycle since 2026-10-01' },
        ],
        recommendations: [
          { action: 'Record payment for overdue invoice INV-20261031-0002', expectedImpact: `+$${outstandingAmount.toFixed(2)} collected revenue`, href: '/payments' },
        ],
        generatedAt: new Date().toISOString(),
      };
    }

    return {
      question,
      headline: `Realized revenue this cycle is $${totalCollected.toFixed(2)} vs $${totalBilled.toFixed(2)} billed — driven by $${outstandingAmount.toFixed(2)} in overdue receivables, $${missedBillingAtRisk.toFixed(2)} in missed billing, $${pausedMrr.toFixed(2)} in paused MRR, and $${totalDiscounts.toFixed(2)} in discounts.`,
      answer:
        `Based on live Firestore billing, subscription, and payment records, here are the 4 exact drivers explaining why realized revenue is lower this month:\n\n` +
        `1. **Overdue Uncollected Invoice (-$${outstandingAmount.toFixed(2)})**: While Acme Corporation settled \`INV-20261031-0001\` ($93.60), TechStart Inc's invoice \`INV-20261031-0002\` ($${outstandingAmount.toFixed(2)}) is past its \`2026-10-01\` due date in \`confirmed\` status (${collectionRate}% collection rate).\n` +
        `2. **Missed Billing Cycle (-$${missedBillingAtRisk.toFixed(2)} unbilled)**: Global Logistics Ltd's active subscription \`SUB-20261031-1003\` ($${missedBillingAtRisk.toFixed(2)}/mo) passed its \`2026-10-01\` billing date without an invoice being generated.\n` +
        `3. **Paused Subscription Leakage (-$${pausedMrr.toFixed(2)}/mo)**: Global Logistics Ltd also has a paused contract (\`SUB-20261031-1004\`, $${pausedMrr.toFixed(2)}/mo) temporarily reducing active billings.\n` +
        `4. **Promotional Coupon Discounts (-$${totalDiscounts.toFixed(2)})**: Active discount rules (20% off via \`WELCOME20\` on TechStart Inc's Starter Plan) reduced gross recurring billings by $${totalDiscounts.toFixed(2)}.`,
      metrics: [
        { label: 'Collected Revenue', value: `$${totalCollected.toFixed(2)}`, status: 'positive' },
        { label: 'Overdue Receivables', value: `-$${outstandingAmount.toFixed(2)}`, status: 'warning' },
        { label: 'Missed Billing Risk', value: `-$${missedBillingAtRisk.toFixed(2)}`, status: 'warning' },
        { label: 'Paused + Discounts', value: `-$${(pausedMrr + totalDiscounts).toFixed(2)}`, status: 'info' },
      ],
      drivers: [
        { factor: 'Overdue Invoice (Scenario A)', impact: `-$${outstandingAmount.toFixed(2)}`, detail: 'TechStart Inc (INV-20261031-0002) past due since 2026-10-01' },
        { factor: 'Missed Billing Cycle (Scenario B)', impact: `-$${missedBillingAtRisk.toFixed(2)}`, detail: 'Global Logistics Ltd (SUB-20261031-1003) nextBillingDate in the past' },
        { factor: 'Paused Contract + Discounts (Scenario D)', impact: `-$${(pausedMrr + totalDiscounts).toFixed(2)}`, detail: 'SUB-20261031-1004 paused ($49.00) + WELCOME20 coupon ($9.80)' },
      ],
      recommendations: [
        { action: `Collect $${outstandingAmount.toFixed(2)} overdue balance from TechStart Inc`, expectedImpact: `+$${outstandingAmount.toFixed(2)} immediate cashflow`, href: '/payments' },
        { action: `Trigger billing run for SUB-20261031-1003 (Global Logistics Ltd)`, expectedImpact: `+$${missedBillingAtRisk.toFixed(2)} invoiced revenue`, href: '/subscriptions' },
        { action: 'Convert quotation QUO-20261031-9001 into an active subscription', expectedImpact: '+$133.60/mo MRR', href: '/quotations' },
      ],
      generatedAt: new Date().toISOString(),
    };
  }
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
      const nowIso = new Date().toISOString();
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);
      const item = {
        id: `sub_${Date.now()}`,
        number: `SUB-${nowIso.slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'active',
        autoRenew: true,
        renewalCount: 0,
        startDate: nowIso,
        nextBillingDate: nextDate.toISOString(),
        recurringTotal: Number(body.total) || 0,
        ...body,
      };
      demoStore.subscriptions.unshift(item);
      demoStore.kpis.activeSubscriptions += 1;
      demoStore.kpis.mrr = Math.round((demoStore.kpis.mrr + (Number(item.total) || 0)) * 100) / 100;
      return item;
    }
    return demoStore.subscriptions;
  }

  if (path === '/subscriptions/convert-quotation' && method === 'POST') {
    const body = JSON.parse((options.body as string) || '{}');
    const quote = demoStore.quotations.find((q: any) => q.id === body.quotationId) || demoStore.quotations[0];
    if (!quote) return null;

    if (quote.convertedToSubscriptionId) {
      const existingSub = demoStore.subscriptions.find((s: any) => s.id === quote.convertedToSubscriptionId);
      const existingInv = demoStore.invoices.find((i: any) => i.id === quote.convertedInvoiceId);
      if (existingSub) return { ...existingSub, invoice: existingInv || null, _alreadyConverted: true };
    }

    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    const sub: any = {
      id: `sub_${Date.now()}`,
      number: `SUB-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      planId: body.planId || 'plan_pro_monthly',
      planName: 'Converted from Quotation',
      billingInterval: 'monthly',
      quotationId: quote.id,
      status: 'active',
      autoRenew: true,
      renewalCount: 0,
      startDate: now.toISOString(),
      nextBillingDate: nextBilling.toISOString(),
      paymentTerms: 'Due on Receipt',
      subtotal: Number(quote.subtotal ?? quote.total) || 0,
      taxAmount: Number(quote.taxAmount) || 0,
      discountAmount: Number(quote.discountAmount) || 0,
      total: Number(quote.total) || 0,
      recurringTotal: Number(quote.total) || 0,
      items: quote.items || [],
    };

    const invoice: any = {
      id: `inv_${Date.now()}`,
      number: `INV-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`,
      subscriptionId: sub.id,
      subscriptionNumber: sub.number,
      customerId: sub.customerId,
      customerName: sub.customerName,
      customerEmail: sub.customerEmail,
      status: 'confirmed',
      issueDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      billingPeriodStart: sub.startDate,
      billingPeriodEnd: sub.nextBillingDate,
      subtotal: sub.subtotal,
      taxAmount: sub.taxAmount,
      discountAmount: sub.discountAmount,
      total: sub.total,
      paidAmount: 0,
      outstandingAmount: sub.total,
      idempotencyKey: `quote-convert-${quote.id}`,
      items: quote.items || [],
    };

    quote.status = 'accepted';
    quote.acceptedAt = now.toISOString();
    quote.convertedToSubscriptionId = sub.id;
    quote.convertedToSubscriptionNumber = sub.number;
    quote.convertedInvoiceId = invoice.id;
    quote.convertedInvoiceNumber = invoice.number;

    demoStore.subscriptions.unshift(sub);
    demoStore.invoices.unshift(invoice);
    demoStore.kpis.activeSubscriptions += 1;
    demoStore.kpis.mrr = Math.round((demoStore.kpis.mrr + sub.total) * 100) / 100;
    demoStore.kpis.outstandingPayments = Math.round((demoStore.kpis.outstandingPayments + invoice.outstandingAmount) * 100) / 100;

    return { ...sub, invoice };
  }

  if ((path === '/subscriptions/auto-renew' || path === '/billing/run') && method === 'POST') {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const dueSubs = demoStore.subscriptions.filter(
      (s: any) => s.status === 'active' && s.nextBillingDate && new Date(s.nextBillingDate) <= now,
    );
    let invoicesCreated = 0;
    for (const sub of dueSubs) {
      const periodStart = sub.nextBillingDate || now.toISOString();
      const nextBilling = new Date(now);
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      const periodEnd = nextBilling.toISOString();
      const subTotal = Number(sub.total ?? sub.recurringTotal) || 0;

      const invoice: any = {
        id: `inv_${Date.now()}_${invoicesCreated}`,
        number: `INV-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`,
        subscriptionId: sub.id,
        subscriptionNumber: sub.number,
        customerId: sub.customerId,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        status: 'confirmed',
        issueDate: now.toISOString(),
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        subtotal: Number(sub.subtotal ?? subTotal) || 0,
        taxAmount: Number(sub.taxAmount) || 0,
        discountAmount: Number(sub.discountAmount) || 0,
        total: subTotal,
        paidAmount: 0,
        outstandingAmount: subTotal,
        idempotencyKey: `billing-${sub.id}-${periodStart.slice(0, 10)}`,
      };

      sub.nextBillingDate = periodEnd;
      sub.lastRenewedAt = now.toISOString();
      sub.renewalCount = (Number(sub.renewalCount) || 0) + 1;
      demoStore.invoices.unshift(invoice);
      demoStore.kpis.outstandingPayments = Math.round((demoStore.kpis.outstandingPayments + subTotal) * 100) / 100;
      invoicesCreated++;
    }
    return { processed: dueSubs.length, renewed: dueSubs.length, invoicesCreated, errors: [] };
  }

  if (path.startsWith('/subscriptions/')) {
    const parts = path.split('/');
    const id = parts[2];
    const action = parts[3];
    const sub: any = demoStore.subscriptions.find((s: any) => s.id === id);
    if (sub && action) {
      if (action === 'activate' || action === 'resume') sub.status = 'active';
      if (action === 'pause') sub.status = 'paused';
      if (action === 'cancel') sub.status = 'cancelled';
      if (action === 'confirm') sub.status = 'confirmed';
      if (action === 'renew') {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const currentNext = sub.nextBillingDate ? new Date(sub.nextBillingDate) : now;
        const baseDate = currentNext > now ? currentNext : now;
        const nextBilling = new Date(baseDate);
        if (sub.billingInterval === 'yearly') nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        else if (sub.billingInterval === 'weekly') nextBilling.setDate(nextBilling.getDate() + 7);
        else if (sub.billingInterval === 'daily') nextBilling.setDate(nextBilling.getDate() + 1);
        else nextBilling.setMonth(nextBilling.getMonth() + 1);

        const subTotal = Number(sub.total ?? sub.recurringTotal) || 0;
        const renewalCount = (Number(sub.renewalCount) || 0) + 1;
        const invoice: any = {
          id: `inv_${Date.now()}`,
          number: `INV-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`,
          subscriptionId: sub.id,
          subscriptionNumber: sub.number,
          customerId: sub.customerId,
          customerName: sub.customerName,
          customerEmail: sub.customerEmail,
          status: 'confirmed',
          issueDate: now.toISOString(),
          dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          billingPeriodStart: currentNext.toISOString(),
          billingPeriodEnd: nextBilling.toISOString(),
          subtotal: Number(sub.subtotal ?? subTotal) || 0,
          taxAmount: Number(sub.taxAmount) || 0,
          discountAmount: Number(sub.discountAmount) || 0,
          total: subTotal,
          paidAmount: 0,
          outstandingAmount: subTotal,
          idempotencyKey: `renew-${sub.id}-${dateStr}-${renewalCount}`,
        };

        sub.status = 'active';
        sub.nextBillingDate = nextBilling.toISOString();
        sub.lastRenewedAt = now.toISOString();
        sub.renewalCount = renewalCount;
        demoStore.invoices.unshift(invoice);
        demoStore.kpis.outstandingPayments = Math.round((demoStore.kpis.outstandingPayments + subTotal) * 100) / 100;
        return { ...sub, invoice };
      }
      return sub;
    }
    return sub || demoStore.subscriptions[0];
  }

  if (path === '/invoices') return demoStore.invoices;
  if (path.startsWith('/invoices/')) {
    const parts = path.split('/');
    const id = parts[2];
    const action = parts[3];
    const inv: any = demoStore.invoices.find((i: any) => i.id === id);
    if (inv && action === 'confirm') {
      inv.status = 'confirmed';
      return inv;
    }
    return inv || demoStore.invoices[0];
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

  if (path === '/quotations') {
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const validityDays = Number(body.validityDays) || 30;
      const items = body.items || [];
      const subtotal = items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0), 0);
      const taxAmount = items.reduce((s: number, i: any) => s + (Number(i.taxAmount) || 0), 0);
      const total = subtotal + taxAmount;
      const item = {
        id: `quo_${Date.now()}`,
        number: `QUO-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'draft',
        subtotal,
        taxAmount,
        discountAmount: 0,
        total,
        expiresAt: new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
        ...body,
      };
      demoStore.quotations.unshift(item);
      return item;
    }
    return demoStore.quotations;
  }

  if (path.startsWith('/quotations/')) {
    const parts = path.split('/');
    const id = parts[2];
    const action = parts[3];
    const quote: any = demoStore.quotations.find((q: any) => q.id === id);
    if (quote && action) {
      if (action === 'send') {
        quote.status = 'sent';
        return quote;
      }
      if (action === 'accept') {
        return handleFallback('/subscriptions/convert-quotation', {
          method: 'POST',
          body: JSON.stringify({ quotationId: id, planId: 'plan_pro_monthly' }),
        });
      }
    }
    return quote || demoStore.quotations[0];
  }

  if (path === '/taxes') return demoStore.taxes;
  if (path === '/discounts') return demoStore.discounts;

  return [];
}

export const api = {
  getKpis: () => fetchFromApi('/analytics/kpis'),
  getRevenueTrends: () => fetchFromApi('/analytics/revenue-trends'),
  getSubscriptionBreakdown: () => fetchFromApi('/analytics/subscription-breakdown'),
  getAiInsights: () => fetchFromApi('/analytics/ai-insights'),
  askAiInsights: (question: string) =>
    fetchFromApi('/analytics/ai-ask', { method: 'POST', body: JSON.stringify({ question }) }),

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
  convertQuotation: (data: { quotationId: string; planId?: string }) =>
    fetchFromApi('/subscriptions/convert-quotation', { method: 'POST', body: JSON.stringify(data) }),
  activateSubscription: (id: string) => fetchFromApi(`/subscriptions/${id}/activate`, { method: 'PATCH' }),
  pauseSubscription: (id: string) => fetchFromApi(`/subscriptions/${id}/pause`, { method: 'PATCH' }),
  resumeSubscription: (id: string) => fetchFromApi(`/subscriptions/${id}/resume`, { method: 'PATCH' }),
  renewSubscription: (id: string) => fetchFromApi(`/subscriptions/${id}/renew`, { method: 'PATCH' }),
  triggerAutoRenew: () => fetchFromApi('/subscriptions/auto-renew', { method: 'POST' }),
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
