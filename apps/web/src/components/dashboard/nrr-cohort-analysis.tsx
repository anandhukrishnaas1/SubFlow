'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ChevronDown, TrendingUp } from 'lucide-react';

const COHORT_DATA = [
  { quarter: 'Q1 21', retention: 94, churn: 6, label: '10.6%' },
  { quarter: 'Q2 21', retention: 93, churn: 7, label: '10.6%' },
  { quarter: 'Q3 21', retention: 94, churn: 6, label: '10.6%' },
  { quarter: 'Q4 22', retention: 92, churn: 8, label: '10.9%' },
  { quarter: 'Q1 24', retention: 95, churn: 5, label: '10.6%', isForecast: true },
  { quarter: 'Q2 24', retention: 94, churn: 6, label: '10.8%', isForecast: true },
  { quarter: 'Q3 24', retention: 96, churn: 4, label: '10.6%', isForecast: true },
];

export function NrrCohortAnalysis() {
  const [filter, setFilter] = useState('All cohorts');
  const [timeline, setTimeline] = useState('All quarters');

  return (
    <div className="ui-card p-6 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">NRR Cohort Analysis</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="h-3 w-3" /> Forecast Projection
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quarterly Net Revenue Retention trends across retention and churn cohorts
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer"
            >
              <option>All filters</option>
              <option>Enterprise</option>
              <option>Mid-Market</option>
              <option>Startup</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer"
            >
              <option>All months</option>
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
              <option>2026 YTD</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={COHORT_DATA} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="quarter"
              stroke="#94a3b8"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl space-y-1 border border-slate-800">
                      <p className="font-bold text-slate-200 flex items-center justify-between gap-4">
                        <span>{data.quarter}</span>
                        {data.isForecast && (
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Forecast
                          </span>
                        )}
                      </p>
                      <div className="flex items-center justify-between gap-4 text-emerald-400">
                        <span>Retention:</span>
                        <span className="font-mono font-bold">{data.retention}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-rose-400">
                        <span>Churn:</span>
                        <span className="font-mono font-bold">{data.churn}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="retention" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
            <Bar dataKey="churn" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Custom Legend */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-emerald-500" />
          <span className="text-slate-700">Retention</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-rose-500" />
          <span className="text-slate-700">Churn</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-normal">
          <span>* Q1-Q3 24 shaded bars indicate projected retention cohorts</span>
        </div>
      </div>
    </div>
  );
}
