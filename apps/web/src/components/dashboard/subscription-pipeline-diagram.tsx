'use client';

import React, { useState } from 'react';
import {
  FileText,
  Repeat,
  Zap,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

export function SubscriptionPipelineDiagram() {
  const { formatAmount } = useCurrency();
  const [activeStep, setActiveStep] = useState<number>(2);

  const steps = [
    {
      id: 1,
      title: 'Quotation Ingestion',
      subtitle: 'e-Signature & Approval',
      icon: FileText,
      metric: formatAmount(18400),
      metricLabel: 'Active Pipeline',
      badge: '94% Win Rate',
      tech: 'SubFlow Quote Engine → e-Sign Webhook',
      details: 'Drafted quotations convert to live subscriptions upon customer acceptance or admin one-click confirmation.',
    },
    {
      id: 2,
      title: 'Subscription Engine',
      subtitle: 'Cycle Provisioning',
      icon: Repeat,
      metric: '350 Active',
      metricLabel: 'Live Subscribers',
      badge: '+12 Today',
      tech: 'Firestore State Engine & Event Emitter',
      details: 'Subscriptions manage multi-tier plans (Starter, Pro, Enterprise), track recurring cycles, and calculate proration.',
    },
    {
      id: 3,
      title: 'Automated Billing',
      subtitle: 'BullMQ Cron Dispatch',
      icon: Zap,
      metric: formatAmount(42860),
      metricLabel: 'Monthly Invoiced',
      badge: '100% On Time',
      tech: 'BullMQ Scheduled Queue & PDFKit Engine',
      details: 'Automated billing jobs evaluate due dates, apply active discounts and region taxes, and generate PDF invoices.',
    },
    {
      id: 4,
      title: 'Payment Settlement',
      subtitle: 'Multi-Gateway Collect',
      icon: CreditCard,
      metric: '99.4%',
      metricLabel: 'First-Try Success',
      badge: 'Instant Sync',
      tech: 'Stripe, Razorpay & UPI AutoPay Webhooks',
      details: 'Seamlessly processes card tokenization, direct bank debits, and Indian UPI AutoPay mandates.',
    },
    {
      id: 5,
      title: 'Smart Dunning',
      subtitle: 'Recovery & Retention',
      icon: ShieldCheck,
      metric: '98.6%',
      metricLabel: 'Recovered Revenue',
      badge: 'AI Smart Retries',
      tech: 'Intelligent Exponential Backoff Scheduler',
      details: 'Failed payments trigger smart retry sequences with automated customer email alerts, preventing involuntary churn.',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.05)] transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-black">
              <Cpu className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-lg font-black text-stone-900 tracking-tight">
              Subscription Lifecycle & Pipeline Architecture
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            Interactive view of SubFlow&apos;s automated recurring billing pipeline and payment mechanics
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            All 5 Systems Operational
          </span>
        </div>
      </div>

      {/* Interactive Pipeline Diagram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;

          return (
            <div key={step.id} className="relative flex flex-col">
              {/* Connector line for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 -right-2 w-4 h-0.5 bg-stone-200 z-10 pointer-events-none" />
              )}

              <button
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`flex-1 text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-b from-orange-50/80 to-white border-orange-500 shadow-md ring-2 ring-orange-400/20'
                    : 'bg-stone-50/50 hover:bg-stone-50 border-stone-200/80 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-white border border-stone-200/90 text-stone-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-orange-600 text-white'
                          : 'bg-stone-200/70 text-stone-600'
                      }`}
                    >
                      Step 0{step.id}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-stone-900 leading-tight">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5 font-medium leading-tight">
                    {step.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/60">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-black text-stone-900 font-mono">
                      {step.metric}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                      {step.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
                    {step.metricLabel}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Step Deep-Dive Inspector Banner */}
      {steps.find((s) => s.id === activeStep) && (
        <div className="mt-5 p-4 rounded-2xl bg-[#fbfaf8] border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-stone-900 text-xs">
                  {steps[activeStep - 1].title} — Architecture Insights
                </span>
                <span className="font-mono text-[10px] text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-md font-semibold">
                  {steps[activeStep - 1].tech}
                </span>
              </div>
              <p className="text-stone-600 text-[11px] mt-0.5 font-medium">
                {steps[activeStep - 1].details}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] text-stone-400 font-medium">Auto-pilot managed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      )}
    </div>
  );
}
