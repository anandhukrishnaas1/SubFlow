'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Users,
  Link as LinkIcon,
  ArrowUpRight,
} from 'lucide-react';

const CHURN_PIE = [
  { name: 'Retained', value: 88, color: '#e2e8f0' },
  { name: 'At Risk', value: 12, color: '#ef4444' },
];

const UPSELL_DATA = [
  { month: 'Jan', val: 120 },
  { month: 'Feb', val: 145 },
  { month: 'Mar', val: 138 },
  { month: 'Apr', val: 165 },
  { month: 'May', val: 182 },
  { month: 'Jun', val: 273 },
];

export function ChurnUpsellCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Churn Risk Forecast Card */}
      <div className="ui-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">Churn Risk Forecast</h4>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          </div>

          <div className="relative h-44 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CHURN_PIE}
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {CHURN_PIE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-semibold text-slate-500">Churn</span>
              <span className="text-lg font-extrabold text-slate-900">forecast</span>
              <span className="text-[11px] font-bold text-rose-600">12.4%</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              At-Risk Accounts
            </span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              3 accounts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="h-7 w-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">
                TL
              </div>
              <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">
                AD
              </div>
              <div className="h-7 w-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">
                CS
              </div>
            </div>
            <p className="text-[11px] text-slate-500 truncate">TechStart, Apex, CloudScale</p>
          </div>
        </div>
      </div>

      {/* 2. Upsell Forecast Card */}
      <div className="ui-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">Upsell Forecast</h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Grow: $273,000
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Automated pipeline expansion potential</p>

          <div className="h-36 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={UPSELL_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2 rounded-lg text-xs font-semibold shadow-lg">
                          ${payload[0].value}K Projections
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="val"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-slate-100 pt-3">
          <button className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors">
            <span className="flex items-center gap-1.5 text-slate-800">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Pipeline revenue forecast
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
          <button className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors">
            <span className="flex items-center gap-1.5 text-slate-800">
              <LinkIcon className="h-3.5 w-3.5 text-slate-500" /> Suggested actions
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 3. Expansion Opportunities Card */}
      <div className="ui-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">Expansion Opportunities</h4>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              High Propensity
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Top customer upgrade readiness</p>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  JS
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Jalia Starrkay</p>
                  <p className="text-[10px] text-slate-500">Acme International (50GB storage limit reached)</p>
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  DC
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Dorley Cromer</p>
                  <p className="text-[10px] text-slate-500">TechStart Labs (Requested 24/7 Concierge)</p>
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="text-[11px] text-slate-500">
            Projected ARR lift: <strong className="text-slate-800">+$14,200/yr</strong> with one-click quotation approval.
          </p>
        </div>
      </div>
    </div>
  );
}
