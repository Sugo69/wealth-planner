import React from 'react';
import { User, MapPin } from 'lucide-react';
import { StepperInput } from '../components/Inputs';

const GlobalIdentityBar = ({ config, setConfig }) => {
  const updateGlobal = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-slate-900 text-white p-4 rounded-3xl mb-6 flex items-center justify-between shadow-xl border border-slate-800">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 border-r border-slate-700 pr-8">
          <User className="text-blue-400" size={20} />
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Age</label>
            <StepperInput value={config.currentAge} onChange={(v) => updateGlobal('currentAge', v)} dark />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">End Age</label>
            <StepperInput value={config.lifeExpectancy} onChange={(v) => updateGlobal('lifeExpectancy', v)} dark />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <MapPin className="text-emerald-400" size={20} />
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Utah Relocation Year</label>
            <StepperInput value={config.relocationYear} onChange={(v) => updateGlobal('relocationYear', v)} dark />
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <span className="text-[10px] font-black text-blue-500 uppercase block tracking-tighter">Global Identity Context</span>
        <span className="text-xs text-slate-400">Values applied to all comparison cases</span>
      </div>
    </div>
  );
};

export default GlobalIdentityBar;