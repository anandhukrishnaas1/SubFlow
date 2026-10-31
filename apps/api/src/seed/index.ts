import * as admin from 'firebase-admin';
import * as fs from 'fs';

async function runSeed() {
  console.log('🌱 Starting SubFlow Firestore Seed...');

  const projectId = process.env.FIREBASE_PROJECT_ID || 'subflow-demo';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!admin.apps.length) {
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId,
      });
    } else if (serviceAccountJson) {
      const credentials = serviceAccountJson.trim().startsWith('{')
        ? JSON.parse(serviceAccountJson)
        : JSON.parse(fs.readFileSync(serviceAccountJson, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: credentials.project_id || projectId,
      });
    } else {
      admin.initializeApp({ projectId });
    }
  }

  const db = admin.firestore();
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Seed Products
  console.log('📦 Seeding Products...');
  const products = [
    {
      id: 'prod_cloud_core',
      name: 'SubFlow Cloud Core',
      type: 'service',
      salesPrice: 49.0,
      costPrice: 12.0,
      notes: 'Base subscription cloud tier with 99.9% SLA',
      status: 'active',
      variants: [
        { name: '10GB Storage', additionalPrice: 0 },
        { name: '50GB Storage', additionalPrice: 20 },
        { name: '200GB Storage', additionalPrice: 50 },
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
    {
      id: 'prod_custom_domain',
      name: 'Whitelabel & Custom SSL Domain',
      type: 'digital',
      salesPrice: 19.0,
      costPrice: 2.0,
      notes: 'Custom CNAME and automated TLS provisioning',
      status: 'active',
      variants: [],
    },
  ];

  for (const prod of products) {
    const { variants, id, ...prodData } = prod;
    const ref = db.collection('products').doc(id);
    await ref.set({ ...prodData, createdAt: nowIso, updatedAt: nowIso });

    for (const v of variants) {
      await ref.collection('variants').add({ ...v, createdAt: nowIso });
    }
  }

  // 2. Seed Plans
  console.log('📋 Seeding Plans...');
  const plans = [
    {
      id: 'plan_starter_monthly',
      name: 'Starter Plan (Monthly)',
      description: 'Perfect for small teams getting started with recurring billing',
      basePrice: 49.0,
      billingInterval: 'monthly',
      minQuantity: 1,
      availableFrom: nowIso,
      autoClose: false,
      allowCancel: true,
      allowPause: true,
      allowRenewal: true,
      status: 'active',
      productIds: ['prod_cloud_core'],
      products: [{ id: 'prod_cloud_core', name: 'SubFlow Cloud Core', price: 49.0 }],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'plan_pro_monthly',
      name: 'Professional Plan (Monthly)',
      description: 'Comprehensive features for growing SaaS companies with analytics',
      basePrice: 78.0,
      billingInterval: 'monthly',
      minQuantity: 1,
      availableFrom: nowIso,
      autoClose: false,
      allowCancel: true,
      allowPause: true,
      allowRenewal: true,
      status: 'active',
      productIds: ['prod_cloud_core', 'prod_pro_analytics'],
      products: [
        { id: 'prod_cloud_core', name: 'SubFlow Cloud Core', price: 49.0 },
        { id: 'prod_pro_analytics', name: 'Advanced Real-time Analytics', price: 29.0 },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'plan_enterprise_annual',
      name: 'Enterprise Scale (Annual)',
      description: 'Dedicated infrastructure, 24/7 concierge support, and custom branding',
      basePrice: 1990.0,
      billingInterval: 'yearly',
      minQuantity: 1,
      availableFrom: nowIso,
      autoClose: false,
      allowCancel: true,
      allowPause: true,
      allowRenewal: true,
      status: 'active',
      productIds: ['prod_cloud_core', 'prod_pro_analytics', 'prod_dedicated_support', 'prod_custom_domain'],
      products: [
        { id: 'prod_cloud_core', name: 'SubFlow Cloud Core', price: 49.0 },
        { id: 'prod_pro_analytics', name: 'Advanced Real-time Analytics', price: 29.0 },
        { id: 'prod_dedicated_support', name: '24/7 Dedicated Concierge Support', price: 99.0 },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  for (const plan of plans) {
    const { id, ...planData } = plan;
    await db.collection('plans').doc(id).set(planData);
  }

  // 3. Seed Taxes
  console.log('🏛️ Seeding Taxes...');
  const taxes = [
    {
      id: 'tax_vat_20',
      name: 'Standard VAT (20%)',
      percentage: 20,
      type: 'percentage',
      status: 'active',
      applicableProductIds: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'tax_us_state',
      name: 'State Sales Tax (8.25%)',
      percentage: 8.25,
      type: 'percentage',
      status: 'active',
      applicableProductIds: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  for (const tax of taxes) {
    const { id, ...taxData } = tax;
    await db.collection('taxes').doc(id).set(taxData);
  }

  // 4. Seed Discounts
  console.log('🏷️ Seeding Discounts...');
  const discounts = [
    {
      id: 'disc_welcome20',
      name: 'Welcome Special',
      code: 'WELCOME20',
      type: 'percentage',
      value: 20,
      minPurchase: 0,
      minQuantity: 1,
      startDate: nowIso,
      maxUsage: 100,
      currentUsage: 3,
      applicableProductIds: [],
      appliesToEntireSubscription: true,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'disc_launch50',
      name: 'Launch Savings',
      code: 'LAUNCH50',
      type: 'fixed',
      value: 50,
      minPurchase: 100,
      minQuantity: 1,
      startDate: nowIso,
      maxUsage: 50,
      currentUsage: 1,
      applicableProductIds: [],
      appliesToEntireSubscription: true,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  for (const disc of discounts) {
    const { id, ...discData } = disc;
    await db.collection('discounts').doc(id).set(discData);
  }

  // 5. Seed Users & Customers
  console.log('👥 Seeding Customers & Admin...');
  const users = [
    {
      uid: 'user_admin_001',
      email: 'admin@subflow.io',
      displayName: 'Alex Rivers (Admin)',
      role: 'admin',
      company: 'SubFlow HQ',
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      uid: 'cust_acme_corp',
      email: 'finance@acmecorp.com',
      displayName: 'Acme Corporation',
      role: 'customer',
      company: 'Acme International',
      phone: '+1 (555) 234-5678',
      address: '100 Silicon Blvd, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      zipCode: '94107',
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      uid: 'cust_techstart_inc',
      email: 'billing@techstart.io',
      displayName: 'TechStart Inc',
      role: 'customer',
      company: 'TechStart Labs',
      phone: '+1 (555) 876-5432',
      address: '742 Evergreen Terrace',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      zipCode: '78701',
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      uid: 'cust_global_logistics',
      email: 'operations@globallogistics.com',
      displayName: 'Global Logistics Partners',
      role: 'customer',
      company: 'Global Logistics Group',
      phone: '+44 20 7946 0912',
      address: '25 Bank Street',
      city: 'London',
      state: 'Greater London',
      country: 'UK',
      zipCode: 'E14 5JP',
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  for (const user of users) {
    const { uid, ...uData } = user;
    await db.collection('users').doc(uid).set({ uid, ...uData });
  }

  // 6. Seed Subscriptions
  console.log('🔄 Seeding Subscriptions...');
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
  const subRef1 = db.collection('subscriptions').doc('sub_acme_pro');
  await subRef1.set({
    number: 'SUB-20261031-1001',
    customerId: 'cust_acme_corp',
    customerName: 'Acme Corporation',
    customerEmail: 'finance@acmecorp.com',
    planId: 'plan_pro_monthly',
    planName: 'Professional Plan (Monthly)',
    billingInterval: 'monthly',
    status: 'active',
    startDate: nowIso,
    nextBillingDate: nextMonth,
    paymentTerms: 'Due on Receipt',
    subtotal: 78.0,
    taxAmount: 15.6,
    discountAmount: 0,
    total: 93.6,
    createdBy: 'user_admin_001',
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await subRef1.collection('items').add({
    productId: 'prod_cloud_core',
    productName: 'SubFlow Cloud Core',
    quantity: 1,
    unitPrice: 49.0,
    taxAmount: 9.8,
    discountAmount: 0,
    total: 58.8,
  });
  await subRef1.collection('items').add({
    productId: 'prod_pro_analytics',
    productName: 'Advanced Real-time Analytics',
    quantity: 1,
    unitPrice: 29.0,
    taxAmount: 5.8,
    discountAmount: 0,
    total: 34.8,
  });
  await subRef1.collection('activities').add({
    action: 'ACTIVATED',
    description: 'Subscription activated with Professional Plan (Monthly)',
    performedBy: 'user_admin_001',
    performedByName: 'Alex Rivers (Admin)',
    createdAt: nowIso,
  });

  const subRef2 = db.collection('subscriptions').doc('sub_techstart_starter');
  await subRef2.set({
    number: 'SUB-20261031-1002',
    customerId: 'cust_techstart_inc',
    customerName: 'TechStart Inc',
    customerEmail: 'billing@techstart.io',
    planId: 'plan_starter_monthly',
    planName: 'Starter Plan (Monthly)',
    billingInterval: 'monthly',
    status: 'active',
    startDate: nowIso,
    nextBillingDate: nextMonth,
    paymentTerms: 'Net 15',
    subtotal: 49.0,
    taxAmount: 4.04,
    discountAmount: 9.8,
    total: 43.24,
    createdBy: 'user_admin_001',
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await subRef2.collection('items').add({
    productId: 'prod_cloud_core',
    productName: 'SubFlow Cloud Core',
    quantity: 1,
    unitPrice: 49.0,
    taxAmount: 4.04,
    discountAmount: 9.8,
    total: 43.24,
  });

  // Scenario B (Missed Billing): Active subscription with past nextBillingDate and no invoice for current period
  const pastDueDate = '2026-10-01T00:00:00.000Z';
  const subRef3 = db.collection('subscriptions').doc('sub_global_missed');
  await subRef3.set({
    number: 'SUB-20261031-1003',
    customerId: 'cust_global_logistics',
    customerName: 'Global Logistics Partners',
    customerEmail: 'operations@globallogistics.com',
    planId: 'plan_pro_monthly',
    planName: 'Professional Plan (Monthly)',
    billingInterval: 'monthly',
    status: 'active',
    startDate: '2026-09-01T00:00:00.000Z',
    nextBillingDate: pastDueDate,
    paymentTerms: 'Net 15',
    subtotal: 78.0,
    taxAmount: 15.6,
    discountAmount: 0,
    total: 93.6,
    createdBy: 'user_admin_001',
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  // Scenario D (Revenue Leakage - Paused Subscription)
  const subRef4 = db.collection('subscriptions').doc('sub_global_paused');
  await subRef4.set({
    number: 'SUB-20261031-1004',
    customerId: 'cust_global_logistics',
    customerName: 'Global Logistics Partners',
    customerEmail: 'operations@globallogistics.com',
    planId: 'plan_starter_monthly',
    planName: 'Starter Plan (Monthly)',
    billingInterval: 'monthly',
    status: 'paused',
    startDate: '2026-08-01T00:00:00.000Z',
    nextBillingDate: nextMonth,
    paymentTerms: 'Net 15',
    subtotal: 49.0,
    taxAmount: 0,
    discountAmount: 0,
    total: 49.0,
    createdBy: 'user_admin_001',
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  // 7. Seed Invoices (including Scenario A Overdue Invoice & Scenario C Idempotency Key)
  console.log('🧾 Seeding Invoices...');
  const invRef1 = db.collection('invoices').doc('inv_acme_oct');
  await invRef1.set({
    number: 'INV-20261031-0001',
    subscriptionId: 'sub_acme_pro',
    subscriptionNumber: 'SUB-20261031-1001',
    customerId: 'cust_acme_corp',
    customerName: 'Acme Corporation',
    customerEmail: 'finance@acmecorp.com',
    status: 'paid',
    issueDate: nowIso,
    dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    billingPeriodStart: '2026-10-01T00:00:00.000Z',
    billingPeriodEnd: '2026-10-31T00:00:00.000Z',
    idempotencyKey: 'billing-sub_acme_pro-2026-10-01',
    subtotal: 78.0,
    taxAmount: 15.6,
    discountAmount: 0,
    total: 93.6,
    paidAmount: 93.6,
    outstandingAmount: 0,
    paidAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await invRef1.collection('items').add({
    productName: 'SubFlow Cloud Core',
    quantity: 1,
    unitPrice: 49.0,
    taxAmount: 9.8,
    discountAmount: 0,
    total: 58.8,
  });
  await invRef1.collection('items').add({
    productName: 'Advanced Real-time Analytics',
    quantity: 1,
    unitPrice: 29.0,
    taxAmount: 5.8,
    discountAmount: 0,
    total: 34.8,
  });

  // Scenario A (Overdue Invoice: status = confirmed, dueDate = past, outstandingAmount > 0)
  const invRef2 = db.collection('invoices').doc('inv_techstart_oct');
  await invRef2.set({
    number: 'INV-20261031-0002',
    subscriptionId: 'sub_techstart_starter',
    subscriptionNumber: 'SUB-20261031-1002',
    customerId: 'cust_techstart_inc',
    customerName: 'TechStart Inc',
    customerEmail: 'billing@techstart.io',
    status: 'confirmed',
    issueDate: '2026-09-15T00:00:00.000Z',
    dueDate: pastDueDate,
    billingPeriodStart: '2026-10-01T00:00:00.000Z',
    billingPeriodEnd: '2026-10-31T00:00:00.000Z',
    idempotencyKey: 'billing-sub_techstart_starter-2026-10-01',
    subtotal: 49.0,
    taxAmount: 4.04,
    discountAmount: 9.8,
    total: 43.24,
    paidAmount: 0,
    outstandingAmount: 43.24,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  await invRef2.collection('items').add({
    productName: 'SubFlow Cloud Core',
    quantity: 1,
    unitPrice: 49.0,
    taxAmount: 4.04,
    discountAmount: 9.8,
    total: 43.24,
  });

  // 8. Seed Payments
  console.log('💳 Seeding Payments...');
  await db.collection('payments').doc('pay_acme_001').set({
    invoiceId: 'inv_acme_oct',
    invoiceNumber: 'INV-20261031-0001',
    customerId: 'cust_acme_corp',
    customerName: 'Acme Corporation',
    method: 'card',
    amount: 93.6,
    paymentDate: nowIso,
    transactionRef: 'ch_3N4xZqK28xL9p1',
    notes: 'Credit Card (ending in 4242)',
    createdAt: nowIso,
  });

  // 9. Seed Quotations
  console.log('📝 Seeding Quotations...');
  await db.collection('quotations').doc('quo_acme_expansion').set({
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
    expiresAt: nextMonth,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  // 10. Seed Counters
  console.log('📊 Seeding Counters Analytics document for instant UI snapshots...');
  await db.collection('counters').doc('analytics').set({
    totalCustomers: 3,
    activeSubscriptions: 3,
    mrr: 230.44,
    arr: 2765.28,
    totalRevenue: 93.6,
    outstandingPayments: 43.24,
    overdueInvoices: 1,
    upcomingRenewals: 2,
    lastUpdated: nowIso,
  });

  console.log('✅ SubFlow Firestore seed completed successfully!');
}

runSeed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
