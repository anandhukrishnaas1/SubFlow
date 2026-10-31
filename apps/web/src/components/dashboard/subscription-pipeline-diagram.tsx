'use client';

import React, { useState } from 'react';
import {
  FileText,
  Repeat,
  Zap,
  CreditCard,
  BarChart3,
  Sparkles,
  Cpu,
} from 'lucide-react';

export function SubscriptionPipelineDiagram() {
  const [activeStep, setActiveStep] = useState<number>(2);

  const steps = [
    {
      id: 1,
      title: 'Quote Management',
      subtitle: 'Create and convert quotations',
      icon: FileText,
      area: 'Quotation workflow',
      details: 'Create and send quotations, then convert accepted quotes into subscriptions and invoices.',
    },
    {
      id: 2,
      title: 'Subscription Lifecycle',
      subtitle: 'Manage recurring plans',
      icon: Repeat,
      area: 'Subscription API',
      details: 'Create, activate, pause, resume, renew, and cancel subscriptions across supported billing intervals.',
    },
    {
      id: 3,
      title: 'Scheduled Billing',
      subtitle: 'Generate invoices for due subscriptions',
      icon: Zap,
      area: 'Billing scheduler',
      details: 'Scheduled billing evaluates due subscriptions and creates invoices using configured prices, discounts, and taxes.',
    },
    {
      id: 4,
      title: 'Payment Recording',
      subtitle: 'Reconcile transactions and invoices',
      icon: CreditCard,
      area: 'Payment reconciliation',
      details: 'Record payment transactions and reconcile invoice balances with duplicate-reference protection.',
    },
    {
      id: 5,
      title: 'Analytics & Copilot',
      subtitle: 'Report from billing source records',
      icon: BarChart3,
      area: 'Analytics API',
      details: 'Calculate metrics from source records and explicitly report when historical snapshots are unavailable.',
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
              Subscription & Billing Workflow
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            An interactive overview of supported quotation, subscription, billing, payment, and analytics workflows.
          </p>
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
                  <span className="text-[10px] text-stone-500 font-semibold">
                    {step.area}
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
                  {steps[activeStep - 1].title} — Workflow Details
                </span>
                <span className="font-mono text-[10px] text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-md font-semibold">
                  {steps[activeStep - 1].area}
                </span>
              </div>
              <p className="text-stone-600 text-[11px] mt-0.5 font-medium">
                {steps[activeStep - 1].details}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
