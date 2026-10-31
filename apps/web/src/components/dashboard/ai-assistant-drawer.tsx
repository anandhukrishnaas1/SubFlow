'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  ArrowUp,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Bot,
  User,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  title?: string;
  sections?: Array<{
    heading: string;
    points: string[];
    tag?: string;
    tagColor?: string;
  }>;
  timestamp: string;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  kpis?: any;
}

export function AiAssistantDrawer({ isOpen, onClose, kpis }: AiAssistantDrawerProps) {
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState<'Accounts' | 'Invoices' | 'Retention'>('Accounts');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'user',
      text: 'summarize key takeaways from this dashboard for me',
      timestamp: 'Just now',
    },
    {
      id: 'm2',
      sender: 'ai',
      title: 'Key Takeaways',
      sections: [
        {
          heading: 'Strong Customer Growth',
          points: [
            'Active accounts increased 25% month-over-month',
            'Expansion revenue contributing significantly to MRR growth ($215K reached)',
            'Average contract value (ACV) remains stable at $6.8K',
          ],
          tag: 'Growth',
          tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        },
        {
          heading: 'Revenue Performance Risks',
          points: [
            'MRR growth velocity slightly tapered in second half of the month',
            'Enterprise churn increased from 3.1% to 4.6% in select cohorts',
            'Outstanding invoices total $52.03k across 2 flagged accounts',
          ],
          tag: 'Risk',
          tagColor: 'text-rose-700 bg-rose-50 border-rose-200',
        },
        {
          heading: 'Retention Trends',
          points: [
            'Net Revenue Retention (NRR) holds at healthy 108.4%',
            'Expansion revenue from Pro Analytics add-on is offsetting contraction',
            'Upcoming renewal queue is clear with 24 accounts eligible for upgrade',
          ],
          tag: 'Retention',
          tagColor: 'text-blue-700 bg-blue-50 border-blue-200',
        },
      ],
      timestamp: 'Just now',
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: input,
      timestamp: 'Just now',
    };

    let aiReply: Message;
    const query = input.toLowerCase();

    if (query.includes('churn') || query.includes('risk')) {
      aiReply = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        title: 'Churn Risk Diagnostic',
        sections: [
          {
            heading: 'At-Risk Accounts Identified (3 Accounts)',
            points: [
              'TechStart Labs ($43.24/mo) — invoice overdue past 14 days grace period',
              'Apex Dynamics — decreased API calls by 42% over past 30 days',
              'CloudScale Inc — contract expires in 18 days with auto-renew disabled',
            ],
            tag: 'Immediate Action',
            tagColor: 'text-rose-700 bg-rose-50 border-rose-200',
          },
          {
            heading: 'Recommended Retention Action',
            points: [
              'Deploy automated dunning email reminder with one-click stripe payment link',
              'Offer 15% annual commitment discount (WELCOME20 code applied)',
            ],
          },
        ],
        timestamp: 'Just now',
      };
    } else if (query.includes('forecast') || query.includes('mrr') || query.includes('arr')) {
      aiReply = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        title: 'Revenue Projections (Q4 Forecast)',
        sections: [
          {
            heading: 'MRR Growth Target',
            points: [
              'Current MRR: $215K (Projected: $248K by year end, +15.3%)',
              'Annual Run Rate (ARR): $2.58M with Net New ARR pacing at $42K/month',
              'Upsell pipeline stands at $273,000 potential additional ARR',
            ],
            tag: 'On Track',
            tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          },
        ],
        timestamp: 'Just now',
      };
    } else {
      aiReply = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        title: `Analysis for ${topic}`,
        sections: [
          {
            heading: `Real-time Telemetry: ${input}`,
            points: [
              `All 14 SubFlow event-driven services reporting healthy 99.98% uptime.`,
              `Customer payments processed: 100% verified against Firebase ledger.`,
              `Automated recurring billing cycle scheduled for tomorrow at 00:00 UTC.`,
            ],
          },
        ],
        timestamp: 'Just now',
      };
    }

    setMessages((prev) => [...prev, userMsg, aiReply]);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Dashboard AI assistant</h2>
            <p className="text-[11px] text-slate-500 font-medium">Real-time revenue & subscription intelligence</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Suggested Quick Chips */}
      <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs bg-white">
        {[
          'Summarize key takeaways',
          'Analyze churn risks',
          'Forecast Q4 MRR',
          'Upcoming renewals',
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setInput(chip);
            }}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[11px] font-medium border border-slate-200 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
        {messages.map((m) => (
          <div key={m.id} className="space-y-1.5">
            {m.sender === 'user' ? (
              <div className="flex items-start gap-2.5 justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs font-medium max-w-[85%] shadow-sm">
                  {m.text}
                </div>
                <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                  You
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 text-xs max-w-[90%] shadow-sm space-y-3">
                  {m.title && (
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="font-extrabold text-slate-900 text-sm tracking-tight">{m.title}</span>
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        Live SubFlow Telemetry
                      </span>
                    </div>
                  )}

                  {m.sections?.map((sec, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">{sec.heading}</span>
                        {sec.tag && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sec.tagColor || 'text-slate-600 bg-slate-100'}`}>
                            {sec.tag}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1 pl-1 text-slate-600 text-[11px] leading-relaxed">
                        {sec.points.map((pt, j) => (
                          <li key={j} className="flex items-start gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 bg-white space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next: Record<string, 'Accounts' | 'Invoices' | 'Retention'> = {
                Accounts: 'Invoices',
                Invoices: 'Retention',
                Retention: 'Accounts',
              };
              setTopic(next[topic]);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors"
          >
            <Layers className="h-3 w-3 text-slate-500" />
            <span>Topic: {topic}</span>
          </button>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about churn, revenue, renewals..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-1.5 h-7 w-7 rounded-lg bg-blue-600 disabled:opacity-40 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-sm"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
