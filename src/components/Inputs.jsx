import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

export const CurrencyInput = ({ value, onChange, className = "" }) => (
  <input type="text" value={formatUSD(value)} onChange={(e) => { const raw = String(e.target.value).replace(/[^0-9]/g, ''); onChange(raw === '' ? 0 : parseInt(raw, 10)); }} className={`w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-black outline-none focus:ring-1 focus:ring-blue-500 transition-all ${className}`} />
);

export const NumericInput = ({ value, onChange, className = "", placeholder = "0" }) => (
  <input type="text" value={value === 0 ? "" : value.toString()} placeholder={placeholder} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ''); onChange(raw === '' ? 0 : parseInt(raw, 10)); }} className={`w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-black outline-none focus:ring-1 focus:ring-blue-500 transition-all ${className}`} />
);

export const StepperInput = ({ value, onChange, className = "" }) => (
  <div className={`flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 transition-all ${className}`}>
    <input type="text" value={value} onChange={(e) => { const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0; onChange(val); }} className="w-full p-2 text-sm font-black outline-none bg-transparent" />
    <div className="flex flex-col border-l border-slate-100">
      <button onClick={() => onChange(value + 1)} className="p-1 hover:bg-slate-50 text-slate-400 border-b border-slate-50"><ChevronUp size={12} /></button>
      <button onClick={() => onChange(Math.max(0, value - 1))} className="p-1 hover:bg-slate-50 text-slate-400"><ChevronDown size={12} /></button>
    </div>
  </div>
);