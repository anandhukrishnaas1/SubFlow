'use client';

import React from 'react';
import { Maximize2 } from 'lucide-react';

export function RevenueByPlanCard() {
  // Generate realistic barcode stripes matching the template
  const starterBars = [85, 92, 88, 95, 90, 86, 94, 98, 91, 87, 93, 89, 96, 92];
  const proBars = [65, 58, 62, 59, 64, 60, 63, 61, 57, 65, 62, 59, 64, 60, 58, 63];
  const enterpriseBars = [38, 42, 35, 40, 37, 41, 36, 39, 43, 35, 38, 40, 36];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col justify-between">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Revenue by Plan</span>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                $42,860.00
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                -3.2% vs last month
              </span>
            </div>
          </div>

          <button
            onClick={() => alert('Expanded analytical view')}
            className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
            title="Expand view"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Income Source subtitle */}
        <div className="mt-6 mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Income Source
          </span>
        </div>

        {/* Barcode Striped Histogram Chart matching the template */}
        <div className="h-32 flex items-end justify-between gap-1 pt-4 pb-2 border-b border-slate-100 overflow-hidden">
          {/* Starter Bars (Orange) */}
          {starterBars.map((h, i) => (
            <div
              key={`starter-${i}`}
              className="flex-1 max-w-[6px] rounded-full bg-gradient-to-t from-orange-600 to-orange-500 hover:opacity-80 transition-all cursor-pointer"
              style={{ height: `${h}%` }}
              title={`Starter: $${(h * 135).toLocaleString()}`}
            />
          ))}

          {/* Pro Bars (Amber / Golden Yellow) */}
          {proBars.map((h, i) => (
            <div
              key={`pro-${i}`}
              className="flex-1 max-w-[6px] rounded-full bg-gradient-to-t from-amber-500 to-amber-400 hover:opacity-80 transition-all cursor-pointer"
              style={{ height: `${h}%` }}
              title={`Pro: $${(h * 290).toLocaleString()}`}
            />
          ))}

          {/* Enterprise Bars (Light Slate / Soft Gray) */}
          {enterpriseBars.map((h, i) => (
            <div
              key={`ent-${i}`}
              className="flex-1 max-w-[6px] rounded-full bg-gradient-to-t from-slate-300 to-slate-200 hover:opacity-80 transition-all cursor-pointer"
              style={{ height: `${h}%` }}
              title={`Enterprise: $${(h * 270).toLocaleString()}`}
            />
          ))}
        </div>
      </div>

      {/* Legend below matching template */}
      <div className="flex items-center gap-6 pt-4 text-xs font-semibold flex-wrap">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span className="text-slate-900 font-bold">Starter</span>
          <span className="text-slate-400 font-normal">$12,400</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-slate-900 font-bold">Pro</span>
          <span className="text-slate-400 font-normal">$18,900</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="text-slate-900 font-bold">Enterprise</span>
          <span className="text-slate-400 font-normal">$11,560</span>
        </div>
      </div>
    </div>
  );
}
