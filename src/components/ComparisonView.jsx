import React from 'react';
import { TrendingUp, ShieldCheck, Landmark, ArrowRight } from 'lucide-react';

const ComparisonView = ({ allCasesData, mcData, strategyNames, formatUSD }) => {
  const slots = [1, 2, 3];

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h3 className="font-black text-slate-700 text-xl uppercase tracking-tight flex items-center gap-2">
          <TrendingUp className="text-blue-600" /> Strategic Side-by-Side
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {slots.map((slot) => {
          const config = allCasesData[slot];
          const mc = mcData?.[slot];
          
          if (!config) return (
            <div key={slot} className="p-6 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">
              Empty Slot {slot}
            </div>
          );

          return (
            <div key={slot} className="relative p-6 rounded-3xl border border-slate-200 bg-slate-50/30 flex flex-col space-y-4">
              <div className="text-center pb-4 border-b border-slate-100">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{strategyNames[slot]}</span>
              </div>

              {/* Success Metric */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Success Rate</span>
                <span className={`text-sm font-black ${mc?.successProbability > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {mc ? `${mc.successProbability.toFixed(1)}%` : 'TBD'}
                </span>
              </div>

              {/* End State Metric */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Median Legacy</span>
                <span className="text-sm font-black text-slate-800">
                  {formatUSD(mc?.percentilesData?.[mc.percentilesData.length - 1]?.median || 0)}
                </span>
              </div>

              {/* Tax Metric */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Tax Strategy</span>
                <span className="text-[10px] font-black text-indigo-600 uppercase">
                  {config.rothConversionStrategy || 'None'}
                </span>
              </div>

              <div className="pt-4 mt-auto">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Estate Variance</span>
                  <span className="text-xs font-black text-slate-600">
                    {/* Simplified variance calculation based on available median */}
                    {formatUSD((mc?.percentilesData?.[mc.percentilesData.length - 1]?.median || 0) - config.desiredLegacy)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComparisonView;