'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Activity, ArrowUp, BarChart2, X } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  title?: string;
  sections?: Array<{ heading: string; points: string[] }>;
  timestamp: string;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiAssistantDrawer({ isOpen, onClose }: AiAssistantDrawerProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const askMutation = useMutation({
    mutationFn: (question: string) => api.askAnalytics(question),
  });

  const handleSend = async () => {
    const question = input.trim();
    if (!question || askMutation.isPending) return;

    setMessages((previous) => [
      ...previous,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: question,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setInput('');

    try {
      const response = await askMutation.mutateAsync(question);
      const sections = [
        {
          heading: 'Verified answer',
          points: [response.answer],
        },
        ...(response.interpretation
          ? [{ heading: 'Grounded explanation', points: [response.interpretation] }]
          : []),
        ...(response.evidence?.length
          ? [{
              heading: `Evidence · ${response.period}`,
              points: response.evidence.map(
                (item: { label: string; value: string | number | boolean | null }) =>
                  `${item.label}: ${item.value ?? 'not available'}`,
              ),
            }]
          : []),
        ...(response.limitations?.length
          ? [{ heading: 'Data limitations', points: response.limitations }]
          : []),
      ];
      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-${Date.now()}`,
          sender: 'ai',
          title: response.mode === 'gemini-grounded' ? 'Analytics Copilot' : 'Verified analytics',
          sections,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The analytics request failed.';
      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          sender: 'ai',
          text: `I could not retrieve an answer from the analytics API. ${message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Analytics Copilot</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Answers grounded in current business records
            </p>
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

      <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs bg-white">
        {[
          'What is our current MRR?',
          'How much did we collect this month?',
          'Which invoices are overdue?',
          'Which subscriptions renew in the next seven days?',
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[11px] font-medium border border-slate-200 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
        {messages.length === 0 && (
          <p className="text-xs leading-relaxed text-slate-500 bg-white border border-slate-200 rounded-xl p-4">
            Ask about MRR/ARR, collections, receivables, overdue invoices, renewals, risk signals,
            revenue trends, or whether historical data is sufficient for churn metrics.
          </p>
        )}
        {messages.map((message) => (
          <div key={message.id} className="space-y-1.5">
            {message.sender === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs font-medium max-w-[90%] shadow-sm">
                  {message.text}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 text-xs max-w-[90%] shadow-sm space-y-3">
                  {message.title && (
                    <p className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                      {message.title}
                    </p>
                  )}
                  {message.text && <p className="text-slate-700 leading-relaxed">{message.text}</p>}
                  {message.sections?.map((section, index) => (
                    <div key={`${message.id}-${index}`} className="space-y-1.5">
                      <p className="font-bold text-slate-800">{section.heading}</p>
                      <ul className="space-y-1 pl-1 text-slate-600 text-[11px] leading-relaxed">
                        {section.points.map((point, pointIndex) => (
                          <li key={`${message.id}-${index}-${pointIndex}`} className="flex items-start gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{point}</span>
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
        {askMutation.isPending && (
          <p className="text-xs text-slate-500 pl-9">Checking verified analytics…</p>
        )}
      </div>

      <form
        className="p-3 border-t border-slate-200 bg-white"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSend();
        }}
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your subscription business…"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            aria-label="Ask the analytics copilot"
          />
          <button
            type="submit"
            disabled={!input.trim() || askMutation.isPending}
            className="absolute right-1.5 h-7 w-7 rounded-lg bg-blue-600 disabled:opacity-40 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-sm"
            aria-label="Send question"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
