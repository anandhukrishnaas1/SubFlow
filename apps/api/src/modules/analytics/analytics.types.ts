export interface AnalyticsKpis {
  totalCustomers: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  customerChurnRate: number | null;
  mrr: number;
  arr: number;
  totalRevenue: number;
  totalCollected: number;
  totalInvoiced: number;
  outstandingPayments: number;
  overdueInvoices: number;
  upcomingRenewals: number;
  arpu: number | null;
  netCollectionRate: number | null;
  currency: string;
  generatedAt: string;
  lastUpdated: string;
  dataAvailability: {
    historicalSubscriptionData: boolean;
    churnMetrics: boolean;
    revenueForecast: boolean;
    sourceMode: 'mock' | 'live';
    syntheticDataIncluded: boolean;
  };
}

export interface BillingTrend {
  month: string;
  periodStart: string;
  billed: number;
  collected: number;
  revenue: number;
  paymentsCount: number;
}

export interface AnalyticsRisk {
  reference: string;
  customerId?: string;
  customerName?: string;
  signal: string;
  evidence: string[];
  severity: 'low' | 'medium' | 'high';
  recommendedAction: string;
  detectedAt: string;
}

export interface AnalyticsAskResponse {
  answer: string;
  period: string;
  evidence: Array<{ label: string; value: string | number | boolean | null }>;
  limitations: string[];
  mode: 'deterministic';
}
