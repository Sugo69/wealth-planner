import React from 'react';
import { Home, Users, Zap, ShieldAlert, MapPin } from 'lucide-react';
import { CurrencyInput, StepperInput } from '../components/Inputs';

const FamilyStrategy = ({ config, setConfig, strategyName }) => {
  const updateConfig = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Strategy Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{strategyName}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Family & Lifestyle Configuration</p>
        </div>
        <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">Active Scenario</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real Estate & Relocation Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <MapPin size={14} className="text-teal-500" /> Relocation & Housing
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600">Execute Utah Relocation</span>
            <button 
              onClick={() => updateConfig('isDownsizing', !config.isDownsizing)}
              className={`w-10 h-5 rounded-full relative transition-colors ${config.isDownsizing ? 'bg-teal-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.isDownsizing ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          {config.isDownsizing && (
            <div className="p-4 bg-teal-50/30 rounded-2xl border border-teal-100 space-y-3 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-[9px] font-black text-teal-700 uppercase mb-1">Replacement Home Budget</label>
                <CurrencyInput value={config.replacementHomeValue} onChange={(v) => updateConfig('replacementHomeValue', v)} />
              </div>
            </div>
          )}
        </div>

        {/* AI Labor Stress (Perez Theory) Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Zap size={14} className="text-amber-500" /> AI Disruption Risk
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600">Apply Perez "AI Shock"</span>
            <input 
              type="checkbox" 
              checked={config.perezIntensity > 0} 
              onChange={(e) => updateConfig('perezIntensity', e.target.checked ? 25 : 0)}
              className="w-4 h-4 rounded text-amber-600"
            />
          </div>
          {config.perezIntensity > 0 && (
            <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100 space-y-2">
              <label className="block text-[9px] font-black text-amber-700 uppercase">Portfolio Drawdown Intensity</label>
              <input 
                type="range" min="0" max="60" step="5" 
                value={config.perezIntensity} 
                onChange={(e) => updateConfig('perezIntensity', parseInt(e.target.value))} 
                className="w-full h-1.5 bg-amber-100 accent-amber-600 rounded-lg"
              />
              <div className="text-right font-black text-amber-700 text-xs">{config.perezIntensity}%</div>
            </div>
          )}
        </div>

        {/* Multi-Generational Support Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Users size={14} className="text-rose-500" /> Housing Support for Children
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.childConfigs.slice(0, config.numChildren).map((child) => (
              <div key={child.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase">{child.name}</span>
                  <ShieldAlert size={14} className={child.giftAmount > 0 ? "text-rose-500" : "text-slate-200"} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Major Gift</label>
                    <CurrencyInput 
                      value={child.giftAmount} 
                      onChange={(v) => {
                        const newConfigs = config.childConfigs.map(c => c.id === child.id ? { ...c, giftAmount: v } : c);
                        updateConfig('childConfigs', newConfigs);
                      }} 
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Year</label>
                    <StepperInput 
                      value={child.grantCalendarYear} 
                      onChange={(v) => {
                        const newConfigs = config.childConfigs.map(c => c.id === child.id ? { ...c, grantCalendarYear: v } : c);
                        updateConfig('childConfigs', newConfigs);
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyStrategy;