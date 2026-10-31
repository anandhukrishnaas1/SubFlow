'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Activity, ArrowUp, BarChart2, X } from 'lucide-react';
import { api } from '@/lib/api';

interface Answer {
  answer: string;
  period: string;
  evidence: Array<{ label: string; value: string | number | boolean | null }>;
  limitations: string[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  title?: string;
  sections?: Array<{ heading: string; points: string[] }>;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  kpis?: unknown;
}

const suggestedQuestions = [
  'What is our current MRR?',
  'How much revenue was collected?',
  'Which invoices are overdue?',
  'What is our NRR?',
];

export function AiAssistantDrawer({ isOpen, onClose }: AiAssistantDrawerProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const askMutation = useMutation({
    mutationFn: (question: string) => api.askAnalytics(question),
  });

  const handleSend = async () => {
    const question = input.trim();
    if (!question || askMutation.isPending) return;
    setMessages((items) => [...items, { id: crypto.randomUUID(), sender: 'user', text: question }]);
    setInput('');
    try {
      const response = (await askMutation.mutateAsync(question)) as Answer;
      const sections = [
        { heading: `Answer · ${response.period}`, points: [response.answer] },
        ...(response.evidence.length
          ? [{
              heading: 'Evidence',
              points: response.evidence.map(({ label, value }) => `${label}: ${value ?? 'not available'}`),
            }]
          : []),
        ...(response.limitations.length
          ? [{ heading: 'Data limitations', points: response.limitations }]
          : []),
      ];
      setMessages((items) => [
        ...items,
        { id: crypto.randomUUID(), sender: 'ai', title: 'Verified analytics', sections },
      ]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'The analytics request failed.';
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          sender: 'ai',
          text: `I could not retrieve an answer from the analytics API. ${detail}`,
        },
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-stone-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="px-5 py-4 border-b border-[#e5e2da] flex items-center justify-between bg-[#f7f5f0]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Analytics Copilot</h2>
            <p className="text-[11px] text-stone-500 font-medium">Answers from available billing records</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-lg hover:bg-stone-200/70 flex items-center justify-center text-stone-400 hover:text-stone-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-2 border-b border-stone-100 flex items-center gap-1.5 overflow-x-auto text-xs">
        {suggestedQuestions.map((question) => (
          <button
            type="button"
            key={question}
            onClick={() => setInput(question)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-600 text-[11px] font-medium border border-stone-200"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/60">
        {messages.length === 0 && (
          <p className="text-center text-xs text-stone-500 pt-8">
            Ask about current revenue, collections, invoices, renewals, or customer churn.
          </p>
        )}
        {messages.map((message) => (
          <div key={message.id} className="space-y-1.5">
            {message.sender === 'user' ? (
              <div className="flex justify-end">
                <p className="bg-orange-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs font-medium max-w-[85%]">
                  {message.text}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm p-3.5 text-xs text-stone-700 max-w-[90%] space-y-3">
                  {message.title && <p className="font-bold text-stone-900">{message.title}</p>}
                  {message.text && <p role="alert">{message.text}</p>}
                  {message.sections?.map((section) => (
                    <section key={section.heading}>
                      <p className="font-semibold text-stone-900 mb-1">{section.heading}</p>
                      <ul className="space-y-1">
                        {section.points.map((point) => <li key={point}>{point}</li>)}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {askMutation.isPending && <p role="status" className="text-xs text-stone-500">Checking analytics records…</p>}
      </div>

      <div className="p-4 border-t border-stone-200 bg-white">
        <div className="flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-orange-500/40">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask about your business…"
            className="flex-1 bg-transparent border-none outline-none text-xs text-stone-800 placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || askMutation.isPending}
            className="h-8 w-8 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white flex items-center justify-center"
            aria-label="Send analytics question"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-stone-400 text-center mt-2">
          Historical NRR, revenue churn, cohort retention, and forecasts require snapshots.
        </p>
      </div>
    </div>
  );
}
