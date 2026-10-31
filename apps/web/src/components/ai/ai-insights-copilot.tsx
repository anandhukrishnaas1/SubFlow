'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Loader2,
  X,
  Bot,
  Activity,
} from 'lucide-react';

interface AiInsightsCopilotProps {
  mode?: 'panel' | 'drawer';
  isOpen?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  'Why did revenue decrease this month?',
  'Which customers are at risk of churn or have unpaid balances?',
  'How much revenue is stuck in overdue or unpaid invoices?',
  'Are there any missed billing cycles or duplicate charges?',
  'What is the revenue impact of discounts and coupons?',
];

export function AiInsightsCopilot({
  mode = 'panel',
  isOpen = true,
  onClose,
  compact = false,
}: AiInsightsCopilotProps) {
  const [question, setQuestion] = useState('');
  const [activeResponse, setActiveResponse] = useState<any | null>(null);

  const { data: insightsData, isLoading: loadingInsights } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: () => api.getAiInsights(),
    refetchInterval: 15000,
  });

  const askMutation = useMutation({
    mutationFn: (q: string) => api.askAiInsights(q),
    onSuccess: (data) => {
      setActiveResponse(data);
    },
  });

  const handleAsk = (qToAsk: string) => {
    const trimmed = qToAsk.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    askMutation.mutate(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(question || 'Why did revenue decrease this month?');
  };

  if (mode === 'drawer' && !isOpen) {
    return null;
  }

  const suggestions: string[] = insightsData?.suggestedQuestions || DEFAULT_SUGGESTIONS;
  const anomalies: any[] = insightsData?.anomalies || [];
  const insights: any[] = insightsData?.insights || [];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'critical':
      case 'error':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'healthy':
      case 'positive':
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const content = (
    <div className="space-y-5">
      {/* Copilot Header & Prompt Input */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/90 p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">SubFlow AI Insights & Revenue Copilot</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <Sparkles className="h-2.5 w-2.5" /> Live Firestore Data
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ask natural-language questions about revenue drops, overdue invoices, churn risk, discounts, or billing anomalies.
              </p>
            </div>
          </div>

          {mode === 'drawer' && onClose && (
            <button
              onClick={onClose}
              className="self-end sm:self-auto h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              aria-label="Close AI Copilot"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Question Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <HelpCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder='Ask e.g. "Why did revenue decrease this month?" or "How much is stuck in overdue invoices?"'
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={askMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-60 shrink-0"
          >
            {askMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing Data...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Ask AI Insights
              </>
            )}
          </button>
        </form>

        {/* Suggested Prompts */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Suggested:</span>
          {suggestions.slice(0, compact ? 3 : 5).map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleAsk(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-slate-700/70 hover:border-blue-500/40 transition-all text-left"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Active AI Answer Display */}
        {activeResponse && (
          <div className="mt-5 pt-5 border-t border-slate-800/90 space-y-4 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                  AI Data Analysis Result • Q: &ldquo;{activeResponse.question}&rdquo;
                </span>
                <h3 className="text-sm font-bold text-white mt-1">{activeResponse.headline}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveResponse(null)}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800/70"
              >
                Clear
              </button>
            </div>

            {/* Key Metrics Strip */}
            {Array.isArray(activeResponse.metrics) && activeResponse.metrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {activeResponse.metrics.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${getStatusStyle(m.status)} bg-slate-950/60`}
                  >
                    <span className="block text-[10px] uppercase font-medium opacity-80">{m.label}</span>
                    <span className="text-sm font-extrabold text-white mt-0.5 block">{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Detailed Explanation */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
              {activeResponse.answer}
            </div>

            {/* Root-Cause Drivers & Recommended Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Array.isArray(activeResponse.drivers) && activeResponse.drivers.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Root-Cause Data Drivers
                  </span>
                  {activeResponse.drivers.map((d: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-800/60 last:border-0 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-200">{d.factor}</p>
                        <p className="text-[11px] text-slate-400">{d.detail}</p>
                      </div>
                      <span className="font-mono font-bold text-amber-400 shrink-0">{d.impact}</span>
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(activeResponse.recommendations) && activeResponse.recommendations.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Recommended Actions
                  </span>
                  {activeResponse.recommendations.map((rec: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">{rec.action}</p>
                        <p className="text-[11px] text-emerald-400 font-medium">{rec.expectedImpact}</p>
                      </div>
                      {rec.href && (
                        <Link
                          href={rec.href}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold shrink-0 transition-colors"
                        >
                          Open <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Automated Detection Strip (Overdue, Missed Billing, Duplicate Charges, Revenue Loss) */}
      {anomalies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {anomalies.map((anom: any) => (
            <div
              key={anom.type}
              className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-white">{anom.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(
                      anom.status,
                    )}`}
                  >
                    {anom.status === 'healthy' ? 'Verified' : `${anom.count} Flagged`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{anom.description}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Revenue at risk:</span>
                <span
                  className={`font-bold ${
                    Number(anom.amountAtRisk) > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  ${Number(anom.amountAtRisk || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proactive AI Insights Cards */}
      {!compact && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((item: any) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                  {item.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(
                    item.severity,
                  )}`}
                >
                  {item.metric}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">{item.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.explanation}</p>
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-medium">Action: {item.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (mode === 'drawer') {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in">
        <div className="w-full max-w-3xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
