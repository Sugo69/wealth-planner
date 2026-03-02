import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line } from 'recharts';
import { Landmark, ShieldAlert, HeartPulse, Briefcase, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { CurrencyInput, StepperInput } from '../components/Inputs';

const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const FamilyStrategy = ({ config, setConfig, simulationResult, strategyName, activeSlot }) => {
  const data = simulationResult?.data || [];
  const isBroke = simulationResult?.isBroke;
  const finalBalance = simulationResult?.finalBalance || 0;
  
  const updateConfig = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

  // Legacy Target Line Calculation (Adjusted for inflation)
  const legacyTarget = config.desiredLegacy || 3500000;
  const chartData = data.map(d => {
      const yearsFromNow = d.age - (config.currentAge || 55);
      const inflatedLegacy = legacyTarget * Math.pow(1 + 0.03, yearsFromNow);
      return { ...d, targetLine: inflatedLegacy };
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER & KPIS */}
      <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <Activity className="text-emerald-400" /> Case {activeSlot}: {strategyName}
          </h2>
          <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">Master Horizon Projection & Strategic Playbooks</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700 text-center min-w-[160px]">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Tax Paid</p>
               <p className="text-lg font-black text-rose-400">{formatUSD(simulationResult?.totalTax || 0)}</p>
            </div>
            <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700 text-center min-w-[160px]">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Estate Value</p>
               <p className={`text-lg font-black ${finalBalance >= legacyTarget ? 'text-emerald-400' : 'text-amber-400'}`}>
                 {formatUSD(finalBalance)}
               </p>
            </div>
        </div>
      </div>

      {/* HORIZON CHART */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
        {isBroke && (
          <div className="mb-4 bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 flex items-center gap-3 font-bold text-sm">
            <AlertTriangle size={20} /> Warning: This strategy completely exhausts liquid assets before life expectancy.
          </div>
        )}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="age" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} tickLine={false} axisLine={false} width={60} />
              <Tooltip 
                formatter={(val, name) => [formatUSD(val), name === 'balance' ? 'Liquid Net Worth' : 'Legacy Target']} 
                labelFormatter={l => `Age ${l}`}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={4} fill="url(#colorBal)" />
              <Line type="stepAfter" dataKey="targetLine" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* STRATEGIC PLAYBOOKS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PLAYBOOK 1: SSI & IRMAA */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <Landmark className="text-blue-500" size={20} />
                  <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">SSI & IRMAA Analysis</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Tax Torpedo Mitigation</p>
                  </div>
              </div>
              <div className="space-y-4">
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Primary Claim Age</span>
                      <div className="w-24"><StepperInput min={62} max={70} value={config.primarySsiAge || 67} onChange={v=>updateConfig('primarySsiAge', v)} /></div>
                  </div>
                  <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-100">
                      <span className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Spouse Claim Age</span>
                      <div className="w-24"><StepperInput min={62} max={70} value={config.spouseSsiAge || 67} onChange={v=>updateConfig('spouseSsiAge', v)} /></div>
                  </div>
                  <div className="flex items-center justify-between px-2 pt-2">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Spouse uses 50% Rule</span>
                     <input type="checkbox" checked={config.useSpousalSsiRule !== false} onChange={e=>updateConfig('useSpousalSsiRule', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                      <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Est. Lifetime RMDs</p>
                          <p className="text-sm font-black text-rose-500">{formatUSD(simulationResult?.totalRmd || 0)}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lifetime SSI Collected</p>
                          <p className="text-sm font-black text-emerald-500">{formatUSD(simulationResult?.totalSsiIncome || 0)}</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* PLAYBOOK 2: ROTH CONVERSIONS */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <TrendingUp className="text-emerald-500" size={20} />
                  <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Roth Conversions</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Pre-Tax IRA Depletion Strategy</p>
                  </div>
              </div>
              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Annual Convert Amount</label>
                          <CurrencyInput value={config.annualConversionAmount || 0} onChange={v=>updateConfig('annualConversionAmount', v)} />
                      </div>
                      <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Duration (Years)</label>
                          <StepperInput min={0} max={20} value={config.conversionDuration || 5} onChange={v=>updateConfig('conversionDuration', v)} />
                      </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-bold leading-relaxed">
                      Executing conversions during the "bridge gap" before SSI claims begin allows you to drain the Pre-Tax IRA at lower marginal brackets, severely reducing the RMD spike at age 75.
                  </div>
              </div>
          </div>

          {/* PLAYBOOK 3: HEALTHCARE & ACA */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <HeartPulse className="text-rose-500" size={20} />
                  <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pre-Medicare Healthcare</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Income Management for Subsidies</p>
                  </div>
              </div>
              <div className="space-y-4">
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ACA Premium Engine Offline</p>
                      <p className="text-[9px] text-slate-400 mt-2 px-6">We will wire the HSA/Roth drawdown logic to calculate MAGI and estimate healthcare subsidies in the next phase.</p>
                  </div>
              </div>
          </div>

          {/* PLAYBOOK 4: RETURN TO WORK */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 border-l-4 border-l-indigo-500">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <Briefcase className="text-indigo-500" size={20} />
                  <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Return to Work</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Testing Capital Injection vs Legacy</p>
                  </div>
              </div>
              <div className="space-y-4">
                  <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                     <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Activate Employment</span>
                     <input type="checkbox" checked={config.primaryIsWorking} onChange={e=>updateConfig('primaryIsWorking', e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
                  </div>
                  {config.primaryIsWorking && (
                      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                          <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Expected Salary</label>
                              <CurrencyInput value={config.phase1Salary || 0} onChange={v=>updateConfig('phase1Salary', v)} />
                          </div>
                          <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">End Year</label>
                              <StepperInput value={config.targetRetirementYear || (config.currentYear + 2)} onChange={v=>updateConfig('targetRetirementYear', v)} />
                          </div>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default FamilyStrategy;