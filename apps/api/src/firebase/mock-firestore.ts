export class MockDocRef {
  constructor(
    public readonly id: string,
    private readonly collectionRef: MockCollectionRef,
    private readonly store: Map<string, any>,
  ) {}

  async get(): Promise<any> {
    const key = `${this.collectionRef.name}/${this.id}`;
    const data = this.store.get(key);
    return {
      id: this.id,
      exists: !!data,
      ref: this,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
    };
  }

  async set(data: any, options: { merge?: boolean } = {}): Promise<void> {
    const key = `${this.collectionRef.name}/${this.id}`;
    if (options.merge && this.store.has(key)) {
      const existing = this.store.get(key);
      this.store.set(key, { ...existing, ...data, id: this.id });
    } else {
      this.store.set(key, { ...data, id: this.id });
    }
  }

  async update(data: any): Promise<void> {
    const key = `${this.collectionRef.name}/${this.id}`;
    const existing = this.store.get(key) || {};
    this.store.set(key, { ...existing, ...data, id: this.id });
  }

  async delete(): Promise<void> {
    const key = `${this.collectionRef.name}/${this.id}`;
    this.store.delete(key);
  }

  collection(subName: string): MockCollectionRef {
    return new MockCollectionRef(`${this.collectionRef.name}/${this.id}/${subName}`, this.store);
  }
}

export class MockQuery {
  constructor(
    private readonly collName: string,
    private readonly store: Map<string, any>,
    private readonly filters: Array<{ field: string; op: string; value: any }> = [],
    private readonly orderByField?: string,
    private readonly orderDir?: 'asc' | 'desc',
    private readonly limitCount?: number,
  ) {}

  where(field: string, op: string, value: any): MockQuery {
    return new MockQuery(
      this.collName,
      this.store,
      [...this.filters, { field, op, value }],
      this.orderByField,
      this.orderDir,
      this.limitCount,
    );
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): MockQuery {
    return new MockQuery(this.collName, this.store, this.filters, field, direction, this.limitCount);
  }

  limit(count: number): MockQuery {
    return new MockQuery(this.collName, this.store, this.filters, this.orderByField, this.orderDir, count);
  }

  async get(): Promise<any> {
    const prefix = `${this.collName}/`;
    let items: any[] = [];

    for (const [key, val] of this.store.entries()) {
      if (key.startsWith(prefix) && !key.slice(prefix.length).includes('/')) {
        items.push(val);
      }
    }

    // Fallback: If this is a subcollection query (e.g. subscriptions/sub_1/items) and no direct keys exist,
    // look into the parent doc's property (e.g. parent.items)
    if (items.length === 0 && this.collName.includes('/')) {
      const parts = this.collName.split('/');
      if (parts.length === 3) {
        const parentKey = `${parts[0]}/${parts[1]}`;
        const parentData = this.store.get(parentKey);
        const subProperty = parts[2];
        if (parentData && Array.isArray(parentData[subProperty])) {
          items = parentData[subProperty].map((x: any, idx: number) => ({
            id: x.id || `${subProperty}_${idx}`,
            ...x,
          }));
        }
      }
    }

    for (const f of this.filters) {
      items = items.filter((item) => {
        const v = item[f.field];
        if (f.op === '==' || f.op === '===') return v === f.value;
        if (f.op === '!=') return v !== f.value;
        if (f.op === '>') return v > f.value;
        if (f.op === '>=') return v >= f.value;
        if (f.op === '<') return v < f.value;
        if (f.op === '<=') return v <= f.value;
        if (f.op === 'array-contains') return Array.isArray(v) && v.includes(f.value);
        if (f.op === 'in') return Array.isArray(f.value) && f.value.includes(v);
        return true;
      });
    }

    if (this.orderByField) {
      items.sort((a, b) => {
        const valA = a[this.orderByField!];
        const valB = b[this.orderByField!];
        if (valA === valB) return 0;
        const res = valA > valB ? 1 : -1;
        return this.orderDir === 'desc' ? -res : res;
      });
    }

    if (this.limitCount) {
      items = items.slice(0, this.limitCount);
    }

    const docs = items.map((item) => ({
      id: item.id,
      exists: true,
      ref: new MockDocRef(item.id, new MockCollectionRef(this.collName, this.store), this.store),
      data: () => JSON.parse(JSON.stringify(item)),
    }));

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (cb: (doc: any) => void) => docs.forEach(cb),
    };
  }
}

export class MockCollectionRef {
  constructor(
    public readonly name: string,
    private readonly store: Map<string, any>,
  ) {}

  doc(id?: string): MockDocRef {
    const docId = id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return new MockDocRef(docId, this, this.store);
  }

  where(field: string, op: string, value: any): MockQuery {
    return new MockQuery(this.name, this.store, [{ field, op, value }]);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): MockQuery {
    return new MockQuery(this.name, this.store, [], field, direction);
  }

  limit(count: number): MockQuery {
    return new MockQuery(this.name, this.store, [], undefined, undefined, count);
  }

  async get(): Promise<any> {
    return new MockQuery(this.name, this.store).get();
  }

  async add(data: any): Promise<MockDocRef> {
    const ref = this.doc();
    await ref.set(data);
    return ref;
  }
}

export class MockBatch {
  private ops: Array<() => Promise<void>> = [];

  constructor(private readonly store: Map<string, any>) {}

  set(ref: any, data: any, options?: any) {
    this.ops.push(async () => {
      await ref.set(data, options);
    });
    return this;
  }

  update(ref: any, data: any) {
    this.ops.push(async () => {
      await ref.update(data);
    });
    return this;
  }

  delete(ref: any) {
    this.ops.push(async () => {
      await ref.delete();
    });
    return this;
  }

  async commit(): Promise<void> {
    for (const op of this.ops) {
      await op();
    }
  }
}

export class MockFirestore {
  private readonly store = new Map<string, any>();

  constructor() {
    this.seedDefaults();
  }

  collection(name: string): MockCollectionRef {
    return new MockCollectionRef(name, this.store);
  }

  batch(): MockBatch {
    return new MockBatch(this.store);
  }

  async runTransaction(updateFunction: (tx: any) => Promise<any>): Promise<any> {
    const tx = {
      get: (ref: any) => ref.get(),
      set: (ref: any, data: any, opts?: any) => ref.set(data, opts),
      update: (ref: any, data: any) => ref.update(data),
      delete: (ref: any) => ref.delete(),
    };
    return updateFunction(tx);
  }

  private seedDefaults() {
    const now = new Date().toISOString();

    // 1. Users
    const users = [
      {
        id: 'cust_acme_corp',
        uid: 'cust_acme_corp',
        email: 'finance@acmecorp.com',
        displayName: 'Acme Corporation',
        company: 'Acme International',
        phone: '+1 (555) 234-5678',
        address: '100 Silicon Blvd, Suite 400',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        role: 'customer',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'cust_techstart_inc',
        uid: 'cust_techstart_inc',
        email: 'billing@techstart.io',
        displayName: 'TechStart Inc',
        company: 'TechStart Labs',
        phone: '+1 (555) 876-5432',
        address: '742 Evergreen Terrace',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        role: 'customer',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'demo_admin_001',
        uid: 'demo_admin_001',
        email: 'admin@subflow.io',
        displayName: 'Alex Rivers (Admin)',
        role: 'admin',
        createdAt: now,
      },
      {
        id: 'demo_staff_001',
        uid: 'demo_staff_001',
        email: 'staff@subflow.io',
        displayName: 'Jordan Lee (Billing Ops)',
        role: 'staff',
        createdAt: now,
      },
    ];

    for (const u of users) {
      this.store.set(`users/${u.id}`, u);
    }

    // 2. Products
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
        ],
        createdAt: now,
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
        createdAt: now,
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
        createdAt: now,
      },
    ];

    for (const p of products) {
      this.store.set(`products/${p.id}`, p);
    }

    // 3. Plans
    const plans = [
      {
        id: 'plan_starter_monthly',
        name: 'Starter Plan (Monthly)',
        description: 'Perfect for small teams getting started with recurring billing',
        basePrice: 49.0,
        billingInterval: 'monthly',
        minQuantity: 1,
        status: 'active',
        productIds: ['prod_cloud_core'],
        products: [{ id: 'prod_cloud_core', name: 'SubFlow Cloud Core', price: 49.0 }],
        createdAt: now,
      },
      {
        id: 'plan_pro_monthly',
        name: 'Professional Plan (Monthly)',
        description: 'Comprehensive features for growing SaaS companies with analytics',
        basePrice: 78.0,
        billingInterval: 'monthly',
        minQuantity: 1,
        status: 'active',
        productIds: ['prod_cloud_core', 'prod_pro_analytics'],
        products: [
          { id: 'prod_cloud_core', name: 'SubFlow Cloud Core', price: 49.0 },
          { id: 'prod_pro_analytics', name: 'Advanced Real-time Analytics', price: 29.0 },
        ],
        createdAt: now,
      },
    ];

    for (const pl of plans) {
      this.store.set(`plans/${pl.id}`, pl);
    }

    // 4. Subscriptions
    const subscriptions = [
      {
        id: 'sub_acme_pro',
        number: 'SUB-20261031-1001',
        customerId: 'cust_acme_corp',
        customerName: 'Acme Corporation',
        customerEmail: 'finance@acmecorp.com',
        planId: 'plan_pro_monthly',
        planName: 'Professional Plan (Monthly)',
        billingInterval: 'monthly',
        status: 'active',
        startDate: now,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: 78.0,
        taxAmount: 15.6,
        discountAmount: 0,
        total: 93.6,
        items: [
          { productName: 'SubFlow Cloud Core', quantity: 1, unitPrice: 49.0, total: 58.8 },
          { productName: 'Advanced Real-time Analytics', quantity: 1, unitPrice: 29.0, total: 34.8 },
        ],
        createdAt: now,
      },
      {
        id: 'sub_techstart_starter',
        number: 'SUB-20261031-1002',
        customerId: 'cust_techstart_inc',
        customerName: 'TechStart Inc',
        customerEmail: 'billing@techstart.io',
        planId: 'plan_starter_monthly',
        planName: 'Starter Plan (Monthly)',
        billingInterval: 'monthly',
        status: 'active',
        startDate: now,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: 49.0,
        taxAmount: 4.04,
        discountAmount: 9.8,
        total: 43.24,
        items: [
          { productName: 'SubFlow Cloud Core', quantity: 1, unitPrice: 49.0, total: 43.24 },
        ],
        createdAt: now,
      },
    ];

    for (const s of subscriptions) {
      this.store.set(`subscriptions/${s.id}`, s);
    }

    // 5. Invoices
    const invoices = [
      {
        id: 'inv_acme_oct',
        number: 'INV-20261031-0001',
        subscriptionId: 'sub_acme_pro',
        subscriptionNumber: 'SUB-20261031-1001',
        customerId: 'cust_acme_corp',
        customerName: 'Acme Corporation',
        customerEmail: 'finance@acmecorp.com',
        status: 'paid',
        issueDate: now,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
        createdAt: now,
      },
      {
        id: 'inv_techstart_oct',
        number: 'INV-20261031-0002',
        subscriptionId: 'sub_techstart_starter',
        subscriptionNumber: 'SUB-20261031-1002',
        customerId: 'cust_techstart_inc',
        customerName: 'TechStart Inc',
        customerEmail: 'billing@techstart.io',
        status: 'confirmed',
        issueDate: now,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: 49.0,
        taxAmount: 4.04,
        discountAmount: 9.8,
        total: 43.24,
        paidAmount: 0,
        outstandingAmount: 43.24,
        items: [
          { productName: 'SubFlow Cloud Core', quantity: 1, unitPrice: 49.0, total: 43.24 },
        ],
        createdAt: now,
      },
    ];

    for (const inv of invoices) {
      this.store.set(`invoices/${inv.id}`, inv);
    }

    // 6. Payments
    const payments = [
      {
        id: 'pay_acme_001',
        invoiceId: 'inv_acme_oct',
        invoiceNumber: 'INV-20261031-0001',
        customerName: 'Acme Corporation',
        method: 'card',
        amount: 93.6,
        paymentDate: now,
        transactionRef: 'ch_3N4xZqK28xL9p1',
        notes: 'Credit Card (ending in 4242)',
        createdAt: now,
      },
    ];

    for (const p of payments) {
      this.store.set(`payments/${p.id}`, p);
    }

    // 7. Taxes
    const taxes = [
      { id: 'tax_vat_20', name: 'Standard VAT (20%)', percentage: 20, type: 'percentage', status: 'active', createdAt: now },
      { id: 'tax_us_state', name: 'State Sales Tax (8.25%)', percentage: 8.25, type: 'percentage', status: 'active', createdAt: now },
    ];
    for (const t of taxes) {
      this.store.set(`taxes/${t.id}`, t);
    }

    // 8. Discounts
    const discounts = [
      { id: 'disc_welcome20', name: 'Welcome Special', code: 'WELCOME20', type: 'percentage', value: 20, maxUsage: 100, currentUsage: 3, status: 'active', createdAt: now },
      { id: 'disc_launch50', name: 'Launch Savings', code: 'LAUNCH50', type: 'fixed', value: 50, maxUsage: 50, currentUsage: 1, status: 'active', createdAt: now },
    ];
    for (const d of discounts) {
      this.store.set(`discounts/${d.id}`, d);
    }

    // 9. Quotations
    const quotations = [
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
        createdAt: now,
      },
    ];
    for (const q of quotations) {
      this.store.set(`quotations/${q.id}`, q);
    }

    // 10. Counters
    this.store.set('counters/analytics', {
      totalCustomers: 2,
      activeSubscriptions: 2,
      mrr: 121.24,
      arr: 1454.88,
      totalRevenue: 93.6,
      outstandingPayments: 43.24,
      overdueInvoices: 0,
      upcomingRenewals: 2,
    });
  }
}
