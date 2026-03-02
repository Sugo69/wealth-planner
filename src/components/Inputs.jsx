import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

export const CurrencyInput = ({ value, onChange, className = "" }) => (
  <input type="text" value={formatUSD(value)} onChange={(e) => { const raw = String(e.target.value).replace(/[^0-9]/g, ''); onChange(raw === '' ? 0 : parseInt(raw, 10)); }} className={`w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-black outline-none focus:ring-1 focus:ring-blue-500 transition-all ${className}`} />
);

export const NumericInput = ({ value, onChange, className = "", placeholder = "0" }) => (
  <input type="text" value={value === 0 ? "" : value.toString()} placeholder={placeholder} onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ''); onChange(raw === '' ? 0 : parseInt(raw, 10)); }} className={`w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-black outline-none focus:ring-1 focus:ring-blue-500 transition-all ${className}`} />
);

export const StepperInput = ({ value, onChange, min = 0, max = 3000, step = 1, dark = false }) => {
  // Handle Keyboard Up/Down Arrows
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault(); // Prevents the page from scrolling
      onChange(Math.min(max, Number(value) + step));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(min, Number(value) - step));
    }
  };

  return (
    <div className={`flex items-center border rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      <button 
        tabIndex="-1" // Keeps the button out of the tab sequence so you stay in the input
        onClick={() => onChange(Math.max(min, Number(value) - step))} 
        className={`px-3 py-2 flex items-center justify-center transition-colors ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-50 text-slate-500'}`}
      >
        -
      </button>
      
      <input 
        type="text" 
        inputMode="numeric"
        value={value} 
        onChange={e => {
          const val = parseInt(e.target.value);
          if (!isNaN(val)) onChange(val);
        }}
        onKeyDown={handleKeyDown} // The new keyboard listener
        className={`w-full text-center text-sm font-bold outline-none ${dark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}
      />
      
      <button 
        tabIndex="-1" 
        onClick={() => onChange(Math.min(max, Number(value) + step))} 
        className={`px-3 py-2 flex items-center justify-center transition-colors ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-50 text-slate-500'}`}
      >
        +
      </button>
    </div>
  );
};