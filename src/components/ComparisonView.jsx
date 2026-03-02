import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Line } from 'recharts';
import { Scale, Target, Landmark, TrendingUp, AlertTriangle, ArrowRightRight, Zap } from 'lucide-react';
import { runSimulationCore } from '../engine/simulationCore';

const ComparisonView = ({ allCasesData, formatUSD }) => {
  const [compareSlot, setCompareSlot] = useState(2); // Toggle between Case 2 or 3 to compare against Baseline

  // 1. Run the simulation for all 3 cases simultaneously
  const results = useMemo(() => {
    const res = {};
    [1, 2, 3].forEach(slot => {
      const config = allCasesData[slot];
      if (!config) return;
      const events = (config.events || []).filter(ev => !ev.cases || ev.cases.includes(slot));
      res[slot] = runSimulationCore(config, events, false);
    });
    return res;
  }, [allCasesData]);

  // 2. Merge the timeline data for the Overlay Chart
  const chartData = useMemo(() => {
    if (!results[1] || !results[compareSlot]) return [];
    
    const merged = [];
    const baseData = results[1].data;
    const propData = results[compareSlot].data;
    const legacyTarget = allCasesData[1]?.desiredLegacy || 3500000;
    const currentAge = allCasesData[1]?.currentAge || 55;

    for (let i = 0; i < baseData.length; i++) {
        if (propData[i]) {
            const yearsFromNow = baseData[i].age - currentAge;
            merged.push({
                age: baseData[i].age,
                Baseline: baseData[i].balance,
                Proposed: propData[i].balance,
                targetLine: legacyTarget * Math.pow(1 + 0.03, yearsFromNow)
            });
        }
    }
    return merged;
  }, [results, compareSlot, allCasesData]);

  // 3. Instant "AI" Logic Engine for Plain English Summaries
  const generateInsight = () => {
      const base = results[1];
      const prop = results[compareSlot];
      if (!base || !prop) return null;

      const taxDiff = base.totalTax - prop.totalTax; // Positive means proposed saved taxes
      const estateDiff = prop.finalBalance - base.finalBalance; // Positive means proposed made more money

      let taxString = taxDiff > 0 
        ? `saves ${formatUSD(taxDiff)} in lifetime taxes` 
        : `costs ${formatUSD(Math.abs(taxDiff))} more in taxes`;
      
      let estateString = estateDiff > 0 
        ? `results in ${formatUSD(estateDiff)} more ending assets` 
        : `results in ${formatUSD(Math.abs(estateDiff))} less ending assets`;

      return `Compared to your Baseline, this proposed strategy ${taxString} and ${estateString}.`;
  };

  const baseRes = results[1];
  const propRes = results[compareSlot];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER & INSTANT INSIGHTS */}
      <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Scale className="text-amber-400" /> Scenario Analysis
          </h2>
          <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">Evaluating Strategic Trade-offs</p>
        </div>
        
        {/* The Natural Language Summary Box */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex-1 max-w-2xl flex items-start gap-4">
            <div className="bg-indigo-500/20 p-2 rounded-lg shrink-0 mt-1">
                <Zap className="text-indigo-400" size={20} />
            </div>
            <div>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Instant Analysis</p>
                <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                    {generateInsight()}
                </p>
            </div>
        </div>
      </div>

      {/* MAIN CHART SECTION (Root Financial Style) */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-8">
        
        {/* Left: The Chart */}
        <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={18} className="text-slate-400"/> Invested Assets
                </h3>
                
                {/* Scenario Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                    <button onClick={() => setCompareSlot(2)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${compareSlot === 2 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Vs. {allCasesData[2]?.strategyName || 'Case 2'}
                    </button>
                    <button onClick={() => setCompareSlot(3)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${compareSlot === 3 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Vs. {allCasesData[3]?.strategyName || 'Case 3'}
                    </button>
                </div>
            </div>

            <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorProp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="age" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} tickLine={false} axisLine={false} width={60} />
                <Tooltip 
                    formatter={(val, name) => [formatUSD(val), name === 'targetLine' ? 'Legacy Target' : name]}
                    labelFormatter={l => `Age ${l}`}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                
                {/* Stacked visually by placing the larger one first (recharts renders in order) */}
                <Area type="monotone" dataKey="Baseline" stroke="#3b82f6" strokeWidth={3} fill="url(#colorBase)" activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="Proposed" stroke="#10b981" strokeWidth={3} fill="url(#colorProp)" activeDot={{ r: 6 }} />
                <Line type="stepAfter" dataKey="targetLine" name="Legacy Target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* Right: The Impact Breakdown */}
        <div className="w-full xl:w-72 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-100 pt-6 xl:pt-0 xl:pl-8 flex flex-col justify-center space-y-8">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Final Assets Delta</p>
               {propRes && baseRes && (
                   <p className={`text-3xl font-black tracking-tight ${propRes.finalBalance >= baseRes.finalBalance ? 'text-emerald-500' : 'text-rose-500'}`}>
                       {propRes.finalBalance >= baseRes.finalBalance ? '+' : '-'}{formatUSD(Math.abs(propRes.finalBalance - baseRes.finalBalance))}
                   </p>
               )}
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lifetime Tax Delta</p>
               {propRes && baseRes && (
                   <p className={`text-3xl font-black tracking-tight ${propRes.totalTax <= baseRes.totalTax ? 'text-emerald-500' : 'text-rose-500'}`}>
                       {propRes.totalTax <= baseRes.totalTax ? '-' : '+'}{formatUSD(Math.abs(propRes.totalTax - baseRes.totalTax))}
                   </p>
               )}
            </div>
            {propRes?.isBroke && (
               <div className="bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-200 flex items-start gap-2 font-bold text-[11px] uppercase tracking-widest">
                  <AlertTriangle size={16} className="shrink-0" /> Proposed Strategy exhausts capital early.
               </div>
            )}
        </div>
      </div>

      {/* THE MASTER DELTA TABLE (All 3 Cases) */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-6 border-b border-slate-100">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Target size={18} className="text-slate-400"/> Strategic Ledger
             </h3>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                 <thead>
                     <tr className="bg-slate-50 border-b border-slate-200">
                         <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Metric</th>
                         <th className="p-4 text-[10px] font-black text-blue-600 uppercase tracking-widest w-1/4">Case 1: {allCasesData[1]?.strategyName} (Base)</th>
                         <th className="p-4 text-[10px] font-black text-slate-600 uppercase tracking-widest w-1/4">Case 2: {allCasesData[2]?.strategyName}</th>
                         <th className="p-4 text-[10px] font-black text-slate-600 uppercase tracking-widest w-1/4">Case 3: {allCasesData[3]?.strategyName}</th>
                     </tr>
                 </thead>
                 <tbody className="text-sm font-bold text-slate-800">
                     <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                         <td className="p-4 text-[11px] text-slate-500 uppercase tracking-widest">Final Estate Value</td>
                         <td className="p-4">{formatUSD(results[1]?.finalBalance)}</td>
                         <td className="p-4">
                            {formatUSD(results[2]?.finalBalance)} 
                            {results[2] && results[1] && (
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${results[2].finalBalance >= results[1].finalBalance ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {results[2].finalBalance >= results[1].finalBalance ? '+' : ''}{formatUSD(results[2].finalBalance - results[1].finalBalance)}
                                </span>
                            )}
                         </td>
                         <td className="p-4">
                            {formatUSD(results[3]?.finalBalance)}
                            {results[3] && results[1] && (
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${results[3].finalBalance >= results[1].finalBalance ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {results[3].finalBalance >= results[1].finalBalance ? '+' : ''}{formatUSD(results[3].finalBalance - results[1].finalBalance)}
                                </span>
                            )}
                         </td>
                     </tr>
                     <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                         <td className="p-4 text-[11px] text-slate-500 uppercase tracking-widest">Lifetime Taxes Paid</td>
                         <td className="p-4 text-slate-600">{formatUSD(results[1]?.totalTax)}</td>
                         <td className="p-4 text-slate-600">
                            {formatUSD(results[2]?.totalTax)}
                            {results[2] && results[1] && (
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${results[2].totalTax <= results[1].totalTax ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {results[2].totalTax <= results[1].totalTax ? '-' : '+'}{formatUSD(Math.abs(results[2].totalTax - results[1].totalTax))}
                                </span>
                            )}
                         </td>
                         <td className="p-4 text-slate-600">
                            {formatUSD(results[3]?.totalTax)}
                            {results[3] && results[1] && (
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${results[3].totalTax <= results[1].totalTax ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {results[3].totalTax <= results[1].totalTax ? '-' : '+'}{formatUSD(Math.abs(results[3].totalTax - results[1].totalTax))}
                                </span>
                            )}
                         </td>
                     </tr>
                     <tr className="hover:bg-slate-50 transition-colors">
                         <td className="p-4 text-[11px] text-slate-500 uppercase tracking-widest">Est. Lifetime RMDs</td>
                         <td className="p-4 text-slate-600">{formatUSD(results[1]?.totalRmd)}</td>
                         <td className="p-4 text-slate-600">{formatUSD(results[2]?.totalRmd)}</td>
                         <td className="p-4 text-slate-600">{formatUSD(results[3]?.totalRmd)}</td>
                     </tr>
                 </tbody>
             </table>
         </div>
      </div>

    </div>
  );
};

export default ComparisonView;