'use client';

import React, { useState } from 'react';
import { ArrowRight, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const ACTIVITY_DATA = [
  { time: '10:00', load: 30 },
  { time: '12:00', load: 88 },
  { time: '1:00', load: 45 },
  { time: '2:00', load: 60 },
  { time: '3:00', load: 35 },
  { time: '4:00', load: 50 },
];

export function UserActivityCard() {
  const [selectedDay, setSelectedDay] = useState('Wed');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">User Activity</h3>
          <button
            onClick={() => alert('Full activity log')}
            className="h-7 w-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Days Filter */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-100 pb-2">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-2 py-0.5 rounded-full transition-colors ${
                selectedDay === d
                  ? 'text-slate-900 font-extrabold bg-slate-100'
                  : 'hover:text-slate-700'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Smooth Area Wave Chart */}
        <div className="relative h-36 w-full pt-4">
          {/* Peak Usage Floating Tag */}
          <div className="absolute top-2 left-[28%] z-10 bg-slate-900 text-white px-2 py-0.5 rounded-md text-[9px] font-bold shadow-md pointer-events-none">
            Peak Usage
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ACTIVITY_DATA} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#cbd5e1"
                fontSize={10}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold">
                        {payload[0].value}% capacity
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="load"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#activityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Card Snippet matching template */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800">Server Load Normal</p>
            <p className="text-[10px] text-slate-400">Automatic scaling ready</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-400">99.98% SLA</span>
      </div>
    </div>
  );
}
