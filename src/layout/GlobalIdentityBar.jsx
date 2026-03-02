import React from 'react';
import { ShieldCheck } from 'lucide-react';

const GlobalIdentityBar = ({ config, setConfig }) => {
  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 mb-8 flex justify-between items-center shadow-xl">
      <div className="flex-1 max-w-md">
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">
          Client / Family Name
        </label>
        <input 
          type="text" 
          value={config.clientName || ""} 
          onChange={(e) => setConfig(prev => ({...prev, clientName: e.target.value}))}
          className="bg-transparent text-3xl font-black outline-none border-b border-transparent focus:border-blue-500 transition-all w-full placeholder:text-slate-600 pb-1"
          placeholder="Enter Family Name..."
          data-1p-ignore
          autoComplete="off"
        />
      </div>

      {/* Marketable "Active Engine" Graphic */}
      <div className="hidden md:flex items-center gap-4 bg-slate-800/50 border border-slate-700 px-6 py-3 rounded-2xl">
        <div className="bg-emerald-500/20 p-2 rounded-full">
          <ShieldCheck className="text-emerald-400" size={24} />
        </div>
        <div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Simulation Engine</p>
           <p className="text-sm font-bold text-white tracking-wide">AES-256 SECURED</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalIdentityBar;