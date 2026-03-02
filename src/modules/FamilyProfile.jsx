import React, { useState, useRef } from 'react';
import { User, Users, Baby, Plus, Trash2, Target, Briefcase, Gamepad2, GripVertical, Zap, History, CalendarClock } from 'lucide-react';
import { CurrencyInput, StepperInput } from '../components/Inputs';


// --- Default Priority & Fear Blocks ---
const defaultAspirations = [
  "Die With the Most Toys", "Die With Zero", "Retire Early", "Never Run Out of Money",
  "Leave a Legacy", "Give Generously", "Family First", "Maximize Freedom"
];

const defaultFears = [
  "Running Out of Money", "Economic Collapse", "Political Instability", "Children's Financial Struggle",
  "Healthcare Catastrophe", "Inflation / Currency Debasement", "Food / Supply Scarcity", "Loss of Meaning / Identity"
];

const FamilyProfile = ({ config, setConfig }) => {
  const currentYear = new Date().getFullYear();

  const updateProfile = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateChild = (index, field, value) => {
    const newChildren = [...(config.childConfigs || [])];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setConfig(prev => ({ ...prev, childConfigs: newChildren }));
  };

  const addChild = () => {
    const newChildren = [...(config.childConfigs || [])];
    const newId = newChildren.length > 0 ? Math.max(...newChildren.map(c => c.id)) + 1 : 1;
    newChildren.push({ 
      id: newId, 
      name: `Child ${newChildren.length + 1}`, 
      age: 18, 
      monthly: 0, 
      supportDuration: 0, 
      supportStartYear: currentYear,
      grantCalendarYear: currentYear + 5,
      giftAmount: 0 
    });
    setConfig(prev => ({ ...prev, childConfigs: newChildren, numChildren: newChildren.length }));
  };

  const removeChild = (index) => {
    const newChildren = [...(config.childConfigs || [])];
    newChildren.splice(index, 1);
    setConfig(prev => ({ ...prev, childConfigs: newChildren, numChildren: newChildren.length }));
  };

  // --- Prioritization Game Logic (With Drag & Drop) ---
  const currentAspirations = config.aspirations || defaultAspirations;
  const currentFears = config.fears || defaultFears;
  const prioritySnapshots = config.prioritySnapshots || [];

  // Drag and Drop Refs
  const dragItem = useRef();
  const dragOverItem = useRef();
  const dragListType = useRef();

  const handleDragStart = (e, position, type) => {
    dragItem.current = position;
    dragListType.current = type;
    e.dataTransfer.effectAllowed = 'move';
    // Make the dragged item slightly transparent
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnter = (e, position, type) => {
    if (dragListType.current !== type) return; // Prevent dragging between different lists
    dragOverItem.current = position;
  };

  const handleDragEnd = (e, type) => {
    e.target.style.opacity = '1'; // Restore opacity
    if (dragListType.current !== type) return;

    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const list = type === 'aspirations' ? [...currentAspirations] : [...currentFears];
      const draggedContent = list[dragItem.current];
      
      // Remove item from original position and insert at new position
      list.splice(dragItem.current, 1);
      list.splice(dragOverItem.current, 0, draggedContent);
      
      updateProfile(type, list);
    }
    
    // Reset refs
    dragItem.current = null;
    dragOverItem.current = null;
    dragListType.current = null;
  };

  const saveSnapshot = () => {
    const newSnapshot = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      topAspiration: currentAspirations[0],
      topFear: currentFears[0],
      aspirationsList: [...currentAspirations],
      fearsList: [...currentFears]
    };
    updateProfile('prioritySnapshots', [newSnapshot, ...prioritySnapshots]);
  };

  const removeSnapshot = (id) => {
    updateProfile('prioritySnapshots', prioritySnapshots.filter(s => s.id !== id));
  };

  const getLogicInsight = () => {
    const topAsp = currentAspirations[0];
    const topFear = currentFears[0];
    let insight = `The strategic engine will primarily optimize for "${topAsp}", while establishing firm guardrails against "${topFear}".`;

    if (topAsp === "Die With Zero" && currentAspirations.indexOf("Leave a Legacy") < 3) {
       insight += " Structural Tension: You highly ranked both 'Die With Zero' and 'Leave a Legacy'. Decide what 'legacy minimum' must be protected, and treat everything above that as fully spendable.";
    }
    else if (topAsp === "Die With the Most Toys" && currentFears.indexOf("Running Out of Money") < 3) {
       insight += " Structural Tension: High lifestyle spending inherently reduces safety margins. Pick a hard 'safety floor' (cash/bonds/annuities), then allow uncapped lifestyle spending above it.";
    }
    else if (topAsp === "Retire Early" && currentFears.indexOf("Economic Collapse") < 3) {
       insight += " Strategic Tension: Early retirement requires relying on market stability for a longer duration. Adopt flexible spending guardrails for down markets.";
    }
    else if (topAsp === "Maximize Freedom" && currentFears.indexOf("Political Instability") < 3) {
       insight += " Alignment Detected: Freedom is maximized by maintaining liquidity and avoiding locked-in, jurisdictional assets that are vulnerable to policy shifts.";
    }
    else if (topAsp === "Die With Zero" && currentFears.indexOf("Running Out of Money") < 3) {
       insight += " Structural Tension: A 'near zero' plan increases risk if longevity, markets, or health costs surprise you. Buffer your floor significantly.";
    }
    else if (topAsp === "Give Generously" && currentFears.indexOf("Running Out of Money") < 3) {
       insight += " Strategic Tension: Define a giving policy tied strictly to portfolio health (e.g., a percentage of surplus) so giving remains sustainable without threatening your baseline.";
    }
    return insight;
  };

  const primaryIsWorking = (config.targetRetirementYear || 2035) >= currentYear;
  const spouseIsWorking = (config.spouseTargetRetirementYear || 2035) >= currentYear;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <User className="text-blue-600" /> Family Details & Demographics
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Establish the baseline demographics, timelines, and active income.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-y-10">
          
          {/* Demographics & Employment Section */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <Users size={16} className="text-indigo-400"/> Core Demographics & Employment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Primary Profile Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">Primary Details</label>
                  <div className={`text-[9px] font-black uppercase px-2.5 py-1 rounded flex items-center gap-1.5 ${primaryIsWorking ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    <Briefcase size={10} />
                    {primaryIsWorking ? 'Active Income' : 'Retired'}
                  </div>
                </div>
                
                <input 
                  type="text" 
                  value={config.primaryFirstName || ""} 
                  onChange={e => updateProfile('primaryFirstName', e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500 transition-colors" 
                  placeholder="Primary First Name" 
                  data-1p-ignore autoComplete="off" 
                />
                
                <div className="flex gap-4">
                  <div className="flex-1"><label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Birth Year</label><StepperInput value={config.birthYear || 1970} onChange={v => updateProfile('birthYear', v)} /></div>
                  <div className="flex-1"><label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1"><Target size={10}/> Target Retire</label><StepperInput value={config.targetRetirementYear || 2035} onChange={v => updateProfile('targetRetirementYear', v)} /></div>
                </div>

                {/* Conditional Primary Salary & 401k Fields */}
                {primaryIsWorking && (
                  <div className="pt-3 border-t border-slate-200 animate-in slide-in-from-top-2 fade-in duration-300 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Base Salary</label><CurrencyInput value={config.phase1Salary || 0} onChange={v => updateProfile('phase1Salary', v)} /></div>
                      <div><label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Bonus / Stock</label><CurrencyInput value={config.primaryBonus || 0} onChange={v => updateProfile('primaryBonus', v)} /></div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-slate-100/50 rounded-xl border border-slate-200/50">
                      <div><label className="block text-[8px] font-black text-slate-500 mb-1 uppercase">Pre-Tax %</label><StepperInput min={0} max={100} value={config.primary401kPreTax || 0} onChange={v => updateProfile('primary401kPreTax', v)} /></div>
                      <div><label className="block text-[8px] font-black text-slate-500 mb-1 uppercase">Roth %</label><StepperInput min={0} max={100} value={config.primary401kRoth || 0} onChange={v => updateProfile('primary401kRoth', v)} /></div>
                      <div><label className="block text-[8px] font-black text-slate-500 mb-1 uppercase" title="E.g., 50% or 100%">Match Rate %</label><StepperInput min={0} max={100} value={config.primary401kMatch || 0} onChange={v => updateProfile('primary401kMatch', v)} /></div>
                      <div><label className="block text-[8px] font-black text-slate-500 mb-1 uppercase" title="E.g., $10,000/yr">Match Max $</label><CurrencyInput value={config.primary401kMatchMax || 0} onChange={v => updateProfile('primary401kMatchMax', v)} /></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Spouse Profile Card */}
              {config.hasSpouse && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest">Spouse Details</label>
                    <div className={`text-[9px] font-black uppercase px-2.5 py-1 rounded flex items-center gap-1.5 ${spouseIsWorking ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      <Briefcase size={10} />
                      {spouseIsWorking ? 'Active Income' : 'Retired'}
                    </div>
                  </div>
                  
                  <input 
                    type="text" 
                    value={config.spouseFirstName || ""} 
                    onChange={e => updateProfile('spouseFirstName', e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-purple-500 transition-colors" 
                    placeholder="Spouse First Name" 
                    data-1p-ignore autoComplete="off" 
                  />
                  
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Birth Year</label><StepperInput value={config.spouseBirthYear || 1970} onChange={v => updateProfile('spouseBirthYear', v)} /></div>
                    <div className="flex-1"><label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase flex items-center gap-1"><Target size={10}/> Target Retire</label><StepperInput value={config.spouseTargetRetirementYear || 2035} onChange={v => updateProfile('spouseTargetRetirementYear', v)} /></div>
                  </div>

                  {/* Conditional Spouse Salary & 401k Fields */}
                  {spouseIsWorking && (
                    <div className="pt-3 border-t border-slate-200 animate-in slide-in-from-top-2 fade-in duration-300 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Base Salary</label><CurrencyInput value={config.spouseSalary || 0} onChange={v => updateProfile('spouseSalary', v)} /></div>
                        <div><label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Bonus / Stock</label><CurrencyInput value={config.spouseBonus || 0} onChange={v => updateProfile('spouseBonus', v)} /></div>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-slate-100/50 rounded-xl border border-slate-200/50">
                        <div><label className="block text-[8px] font-black text-slate-500 mb-1 uppercase">Pre-Tax %</label><StepperInput min={0} max={100} value={config.spouse401kPreTax || 0} onChange={v => updateProfile('spouse401kPreTax', v)} /></div>
                        <div><label className="block text-[8px] font-black text-slate-500 mb-1 uppercase">Roth %</label><StepperInput min={0} max={100} value={config.spouse401kRoth || 0} onChange={v => updateProfile('spouse401kRoth', v)} /></div>
                        <div><label className="block text-[8px] font-black text-slate-500 mb-1 uppercase" title="E.g., 50% or 100%">Match Rate %</label><StepperInput min={0} max={100} value={config.spouse401kMatch || 0} onChange={v => updateProfile('spouse401kMatch', v)} /></div>
                        <div><label className="block text-[8px] font-black text-slate-500 mb-1 uppercase" title="E.g., $10,000/yr">Match Max $</label><CurrencyInput value={config.spouse401kMatchMax || 0} onChange={v => updateProfile('spouse401kMatchMax', v)} /></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Children Section */}
          <section className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Baby size={16} className="text-rose-400"/> Children
              </h3>
              <button onClick={addChild} className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors">
                <Plus size={12}/> Add Child
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(config.childConfigs || []).map((child, index) => (
                <div key={child.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl relative group">
                  <button onClick={() => removeChild(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors bg-white p-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Name</label>
                      <input 
                        type="text" 
                        value={child.name} 
                        onChange={e => updateChild(index, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-rose-400"
                        data-1p-ignore autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Birth Year</label>
                      <StepperInput value={child.birthYear || 2005} onChange={v => updateChild(index, 'birthYear', v)} />
                    </div>
                  </div>
                </div>
              ))}
              {(!config.childConfigs || config.childConfigs.length === 0) && (
                <div className="col-span-full text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-2xl">
                  No children added to profile
                </div>
              )}
            </div>
          </section>

          {/* NEW: Wealth Priorities & Fears Game */}
          <section className="space-y-5 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Gamepad2 size={16} className="text-amber-500"/> Behavioral Priorities
              </h3>
              <div className="flex items-center gap-4">
                 <button onClick={saveSnapshot} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">
                    <History size={12}/> Log Snapshot
                 </button>
                 <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Drag to Rank 1 (High) to 8 (Low)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Aspirations Column */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-5 shadow-sm">
                 <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                   Aspirations <span className="text-[8px] text-slate-400 font-bold bg-white px-1.5 rounded border border-slate-200">Utility Maximization</span>
                 </h4>
                 <div className="space-y-2">
                   {currentAspirations.map((item, i) => (
                      <div 
                        key={item} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, i, 'aspirations')}
                        onDragEnter={(e) => handleDragEnter(e, i, 'aspirations')}
                        onDragEnd={(e) => handleDragEnd(e, 'aspirations')}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex items-center gap-3 bg-white border border-slate-100 p-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-blue-200 cursor-grab active:cursor-grabbing group"
                      >
                         <div className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black shrink-0">{i + 1}</div>
                         <span className="flex-1 truncate">{item}</span>
                         <div className="text-slate-300 group-hover:text-blue-400 transition-colors shrink-0">
                            <GripVertical size={16} />
                         </div>
                      </div>
                   ))}
                 </div>
              </div>

              {/* Fears Column */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-5 shadow-sm">
                 <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                   Financial Fears <span className="text-[8px] text-slate-400 font-bold bg-white px-1.5 rounded border border-slate-200">Loss Minimization</span>
                 </h4>
                 <div className="space-y-2">
                   {currentFears.map((item, i) => (
                      <div 
                        key={item} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, i, 'fears')}
                        onDragEnter={(e) => handleDragEnter(e, i, 'fears')}
                        onDragEnd={(e) => handleDragEnd(e, 'fears')}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex items-center gap-3 bg-white border border-slate-100 p-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-rose-200 cursor-grab active:cursor-grabbing group"
                      >
                         <div className="w-6 h-6 flex items-center justify-center bg-rose-50 text-rose-700 rounded-lg text-[10px] font-black shrink-0">{i + 1}</div>
                         <span className="flex-1 truncate">{item}</span>
                         <div className="text-slate-300 group-hover:text-rose-400 transition-colors shrink-0">
                            <GripVertical size={16} />
                         </div>
                      </div>
                   ))}
                 </div>
              </div>
            </div>

            {/* Dynamic Logic Model Insight */}
            <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-3xl mt-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
              <div className="relative z-10">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Zap size={14}/> Logic Model Output</h4>
                  <p className="text-xs text-indigo-950 font-semibold leading-relaxed max-w-4xl">
                    {getLogicInsight()}
                  </p>
              </div>
            </div>

            {/* Historical Snapshots Display */}
            {prioritySnapshots.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><CalendarClock size={14}/> Historical Check-ins</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {prioritySnapshots.map(snap => (
                    <div key={snap.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl relative group">
                       <button onClick={() => removeSnapshot(snap.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                       <p className="text-[10px] font-black text-slate-500 mb-3">{snap.date}</p>
                       <div className="space-y-2">
                         <div>
                           <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">#1 Aspiration</p>
                           <p className="text-xs font-bold text-slate-800">{snap.topAspiration}</p>
                         </div>
                         <div>
                           <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">#1 Fear</p>
                           <p className="text-xs font-bold text-slate-800">{snap.topFear}</p>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default FamilyProfile;