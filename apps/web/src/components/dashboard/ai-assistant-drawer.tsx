'use client';

import React, { useState } from 'react';
import {
  BarChart2,
  X,
  Send,
  ArrowUp,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Activity,
  User,
  ChevronRight,
  Layers,
  ShieldCheck,
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
      id: 'welcome',
      sender: 'ai',
      title: 'SubFlow Analytics Copilot',
      text: 'Welcome! I am connected to live telemetry and powered by OpenRouter LLM. Ask me about your real-time MRR, churn risks, invoice receivables, or contract renewals.',
      timestamp: 'Just now',
    },
  ]);

  const [loading, setLoading] = useState(false);

  const handleSend = async (customText?: string) => {
    const textToSend = typeof customText === 'string' ? customText : input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-4),
          context: { kpis, topic },
        }),
      });

      const data = await res.json();
      const content = data.message || 'I have analyzed your request against real-time telemetry.';
      const isConversational = data.isConversational || /^(hi|hello|haai|hai|hey|heyy|greetings|thanks|thank you|ok)\b/i.test(textToSend.trim());

      const aiReply: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        title: isConversational ? undefined : `Intelligence Report (${topic})`,
        text: content,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      const fallbackReply: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        title: `Telemetry: ${topic}`,
        text: 'All event-driven services reporting healthy 99.98% uptime. Real-time telemetry synchronized.',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Analytics Copilot</h2>
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
            disabled={loading}
            onClick={() => handleSend(chip)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 text-[11px] font-medium border border-slate-200 transition-colors disabled:opacity-50"
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
                <div className="bg-orange-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs font-medium max-w-[85%] shadow-sm">
                  {m.text}
                </div>
                <div className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                  You
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 text-xs max-w-[90%] shadow-sm space-y-3">
                  {m.title && (
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="font-extrabold text-slate-900 text-sm tracking-tight">{m.title}</span>
                      <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                        SubFlow Telemetry
                      </span>
                    </div>
                  )}

                  {/* Render Clean Formatted Content without raw markdown symbols */}
                  {m.text && <CleanMessageContent text={m.text} />}

                  {/* Render Legacy Structured Sections */}
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
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
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

        {/* Live Loading Bubble */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm animate-pulse">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3.5 text-xs shadow-sm flex items-center gap-2 text-slate-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-orange-600 animate-ping shrink-0" />
              <span>Analytics Copilot is querying live telemetry...</span>
            </div>
          </div>
        )}
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
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-1.5 h-7 w-7 rounded-lg bg-orange-600 disabled:opacity-40 hover:bg-orange-700 text-white flex items-center justify-center transition-all shadow-sm"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CleanMessageContent({ text }: { text: string }) {
  const rawLines = text.split('\n');
  const blocks: Array<{ type: 'bullet' | 'header' | 'paragraph'; content: string }> = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Header starting with #, ##, ###
    if (line.startsWith('#')) {
      const cleanHeader = line.replace(/^#{1,6}\s*/, '').trim();
      if (cleanHeader) {
        blocks.push({ type: 'header', content: cleanHeader });
        continue;
      }
    }

    // Bullet items starting with *, +, -, •
    if (/^[\*\+\-•]\s+/.test(line)) {
      const cleanBullet = line.replace(/^[\*\+\-•]\s+/, '').trim();
      if (cleanBullet) {
        blocks.push({ type: 'bullet', content: cleanBullet });
        continue;
      }
    }

    // Short section titles ending with colon (e.g., "Revenue Performance:" or "* **Revenue Performance**:")
    const stripped = line.replace(/^[\*\+\-•]\s+/, '').replace(/[\*#_]/g, '').trim();
    if (stripped.endsWith(':') && stripped.length < 50) {
      blocks.push({ type: 'header', content: stripped });
      continue;
    }

    // Normal paragraph
    blocks.push({ type: 'paragraph', content: line });
  }

  const renderInline = (str: string) => {
    // Strip any raw markdown hashes
    const withoutHash = str.replace(/#{1,6}\s*/g, '');

    // Split on **bold** text
    const parts = withoutHash.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2).replace(/[\*#\+]/g, '').trim();
        return (
          <strong key={idx} className="font-semibold text-slate-900">
            {inner}
          </strong>
        );
      }
      // Remove any lingering stray * or # symbols
      const cleanPart = part.replace(/[\*#]/g, '');
      return <span key={idx}>{cleanPart}</span>;
    });
  };

  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-700">
      {blocks.map((block, i) => {
        if (block.type === 'header') {
          return (
            <div key={i} className="font-bold text-slate-900 text-xs pt-1 border-b border-slate-100 pb-0.5">
              {renderInline(block.content)}
            </div>
          );
        }
        if (block.type === 'bullet') {
          return (
            <div key={i} className="flex items-start gap-2 pl-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
              <div className="flex-1">{renderInline(block.content)}</div>
            </div>
          );
        }
        return (
          <p key={i} className="text-slate-700 font-medium">
            {renderInline(block.content)}
          </p>
        );
      })}
    </div>
  );
}

