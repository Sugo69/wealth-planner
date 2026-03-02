import React, { useState, useRef } from 'react';
import { LayoutDashboard, Binary, Scale, Printer, Save, FolderOpen, FileDown, Users, Target, Landmark } from 'lucide-react';

// --- Modular Imports ---
import { useWealthEngine } from './hooks/useWealthEngine';
import GlobalIdentityBar from './layout/GlobalIdentityBar';
import FamilyStrategy from './modules/FamilyStrategy';
import FamilyProfile from './modules/FamilyProfile';
import NetWorth from './modules/NetWorth';
import Goals from './modules/Goals';
import ComparisonView from './components/ComparisonView';
import { defaultConfig } from './config/constants';
import { formatUSD } from './components/Inputs';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const fileInputRef = useRef(null);
  
  // 1. Centralized "Brain" handles all cases, Firebase, and MC data
  const { 
    activeConfig, 
    setActiveConfig, 
    simulationResult, 
    saveCurrentStrategy,
    processExport, 
    processImport, 
    activeSlot, 
    handleSlotChange,
    allCasesData,
    mcData,
    saveStatus
  } = useWealthEngine(defaultConfig);

  // 2. File Import Handler
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      processImport(e.target.result, null); 
    };
    reader.readAsText(file);
    event.target.value = null; 
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 select-none">
      <div className="max-w-[1600px] mx-auto w-full">
        
        {/* Persistent Global Family Context */}
        <GlobalIdentityBar config={activeConfig} setConfig={setActiveConfig} />

        <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <h1 className="text-2xl font-black text-slate-800">Wealth Planner v6.0</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Professional Planning Suite</p>
            </div>
            
            <nav className="flex bg-slate-200/50 p-1 rounded-xl gap-1 shadow-inner overflow-x-auto">
              <button onClick={() => setActivePage('profile')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'profile' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Users size={14} className="inline mr-2 mb-0.5"/> Profile</button>
              <button onClick={() => setActivePage('net-worth')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'net-worth' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Landmark size={14} className="inline mr-2 mb-0.5"/> Net Worth</button>
              
              {/* RENAMED: Events is now Goals */}
              <button onClick={() => setActivePage('goals')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'goals' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Target size={14} className="inline mr-2 mb-0.5"/> Goals</button>

              <button onClick={() => setActivePage('dashboard')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><LayoutDashboard size={14} className="inline mr-2 mb-0.5"/> Strategy</button>
              <button onClick={() => setActivePage('monte-carlo')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'monte-carlo' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Binary size={14} className="inline mr-2 mb-0.5"/> Risks</button>
              <button onClick={() => setActivePage('comparison')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'comparison' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Scale size={14} className="inline mr-2 mb-0.5"/> Compare</button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileImport} accept=".json,.enc" />
             
             <button onClick={() => fileInputRef.current.click()} className="bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-2 hover:bg-slate-50 transition-all">
                <FolderOpen size={16}/> Import
             </button>

             <button onClick={() => processExport(null)} className="bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-2 hover:bg-slate-50 transition-all">
                <FileDown size={16}/> Export
             </button>

             <button onClick={saveCurrentStrategy} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                <Save size={16}/> {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
             </button>

             <button onClick={() => window.print()} className="hidden xl:flex bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase items-center gap-2 hover:bg-slate-900 transition-all">
                <Printer size={16}/> Print
             </button>
          </div>
        </header>

        {/* Slot Switcher - Hidden on intake forms */}
        {['dashboard', 'monte-carlo'].includes(activePage) && (
          <div className="flex gap-2 mb-6 animate-in slide-in-from-top-2">
            {[1, 2, 3].map(slot => (
              <button 
                key={slot} 
                onClick={() => handleSlotChange(slot)} 
                className={`px-8 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeSlot === slot ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
              >
                Case {slot}: {allCasesData[slot]?.strategyName || `Option ${slot}`}
              </button>
            ))}
          </div>
        )}

        {/* Modular Page Routing */}
        <main className="animate-in fade-in duration-700">
          {activePage === 'profile' && (
            <FamilyProfile config={activeConfig} setConfig={setActiveConfig} />
          )}

          {activePage === 'net-worth' && (
            <NetWorth config={activeConfig} setConfig={setActiveConfig} />
          )}

          {activePage === 'goals' && (
            <Goals config={activeConfig} setConfig={setActiveConfig} />
          )}

          {activePage === 'dashboard' && (
            <FamilyStrategy 
              config={activeConfig} 
              setConfig={setActiveConfig} 
              simulationResult={simulationResult} 
              strategyName={activeConfig.strategyName || `Option ${activeSlot}`} 
              activeSlot={activeSlot}
            />
          )}

          {activePage === 'comparison' && (
            <ComparisonView 
              allCasesData={allCasesData} 
              mcData={mcData} 
              formatUSD={formatUSD} 
            />
          )}
        </main>
      </div>
      <footer className="mt-12 border-t border-slate-200 pt-6 pb-12 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
          v6.0 Modular Engine • Client: {activeConfig.clientName || 'Unspecified'} • {new Date().getFullYear()} Strategic Modeling
        </p>
      </footer>
    </div>
  );
};

export default App;