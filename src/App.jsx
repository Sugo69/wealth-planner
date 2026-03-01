import React, { useState } from 'react';
import { LayoutDashboard, ListTree, Binary, Landmark, Scale, Printer, Save } from 'lucide-react';

// --- Modular Imports ---
import { useWealthEngine } from './hooks/useWealthEngine';
import GlobalIdentityBar from './layout/GlobalIdentityBar';
import FamilyStrategy from './modules/FamilyStrategy';
import ComparisonView from './components/ComparisonView';
import { defaultConfig } from './config/constants'; // Move your defaultConfig object to a separate file
import { formatUSD } from './components/Inputs';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  
  // 1. Centralized "Brain" handles all cases, Firebase, and MC data
  const { 
    user, activeSlot, allCasesData, activeConfig, setActiveConfig,
    simulationResult, mcData, saveStatus, 
    handleSlotChange, saveCurrentStrategy 
  } = useWealthEngine(defaultConfig);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 select-none">
      <div className="max-w-[1600px] mx-auto w-full">
        
        {/* 2. Global Identity Context - Persistent across all pages */}
        <GlobalIdentityBar config={activeConfig} setConfig={setActiveConfig} />

        <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800">Wealth Planner v6.0</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Modular Strategy Suite</p>
            </div>
            
            <nav className="flex bg-slate-200/50 p-1 rounded-xl gap-1 shadow-inner">
              <button onClick={() => setActivePage('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><LayoutDashboard size={14} className="inline mr-2"/> Strategy</button>
              <button onClick={() => setActivePage('monte-carlo')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'monte-carlo' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Binary size={14} className="inline mr-2"/> Risks</button>
              <button onClick={() => setActivePage('comparison')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'comparison' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Scale size={14} className="inline mr-2"/> Compare</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={saveCurrentStrategy} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-blue-700">
                <Save size={16}/> {saveStatus === 'saving' ? 'Syncing...' : 'Save All Cases'}
             </button>
             <button onClick={() => window.print()} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"><Printer size={16}/> Print Report</button>
          </div>
        </header>

        {/* 3. Slot Switcher */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(slot => (
            <button key={slot} onClick={() => handleSlotChange(slot)} className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeSlot === slot ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>Case {slot}</button>
          ))}
        </div>

        {/* 4. Page Routing */}
        <main className="animate-in fade-in duration-700">
          {activePage === 'dashboard' && (
            <FamilyStrategy config={activeConfig} setConfig={setActiveConfig} strategyName={activeConfig.strategyName || `Option ${activeSlot}`} />
          )}

          {activePage === 'comparison' && (
            <ComparisonView allCasesData={allCasesData} mcData={mcData} formatUSD={formatUSD} />
          )}
        </main>

      </div>
    </div>
  );
};

export default App;