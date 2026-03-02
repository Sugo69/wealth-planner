import React, { useState, useRef } from 'react';
import { Target, CreditCard, Banknote, Plus, Trash2, HeartHandshake, ChevronDown, Users, GripVertical } from 'lucide-react';
import { CurrencyInput, StepperInput } from '../components/Inputs';

const Goals = ({ config, setConfig }) => {
  const currentYear = new Date().getFullYear();
  
  const goals = (config.events || []).map(ev => ({ 
    ...ev, 
    cases: ev.cases || [1, 2, 3],
    category: ev.category || 'standard' 
  }));

  const addGoal = (type, category = 'standard', template = null) => {
    const newGoal = template ? {
      id: Date.now(),
      type: template.type,
      category: template.category,
      description: template.name,
      amount: template.amount,
      year: template.targetYear || currentYear + 1,
      isRecurring: template.isRecurring,
      recurringFrequency: 1, 
      recurringEndYear: (template.targetYear || currentYear + 1) + (template.duration || 0),
      cases: [1, 2, 3],
      assignee: 'all'
    } : {
      id: Date.now(),
      type: type,
      category: category,
      description: 'New Goal',
      amount: type === 'expense' ? 50000 : 100000,
      year: currentYear + 1,
      isRecurring: false,
      recurringFrequency: category === 'legacy' ? 1 : 7, 
      recurringEndYear: currentYear + 5,
      cases: [1, 2, 3],
      assignee: 'all'
    };
    setConfig(prev => ({ ...prev, events: [...(prev.events || []), newGoal] }));
  };

  const updateGoal = (id, field, value) => {
    setConfig(prev => ({
      ...prev,
      events: prev.events.map(ev => ev.id === id ? { ...ev, [field]: value } : ev)
    }));
  };

  const removeGoal = (id) => {
    setConfig(prev => ({
      ...prev,
      events: prev.events.filter(ev => ev.id !== id)
    }));
  };

  // --- Drag and Drop State & Handlers ---
  const dragItem = useRef();
  const dragOverItem = useRef();
  const dragListType = useRef();

  const handleDragStart = (e, position, type) => {
    dragItem.current = position;
    dragListType.current = type;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnter = (e, position, type) => {
    if (dragListType.current !== type) return; 
    dragOverItem.current = position;
  };

  const handleDragEnd = (e, type) => {
    e.target.style.opacity = '1'; 
    if (dragListType.current !== type) return;

    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      // Isolate the specific list being dragged
      let subList = [];
      if (type === 'legacy') subList = goals.filter(e => e.category === 'legacy');
      else if (type === 'expense') subList = goals.filter(e => e.type === 'expense' && e.category !== 'legacy');
      else if (type === 'income') subList = goals.filter(e => e.type === 'income' && e.category !== 'legacy');

      const draggedContent = subList[dragItem.current];
      
      // Reorder the isolated list
      subList.splice(dragItem.current, 1);
      subList.splice(dragOverItem.current, 0, draggedContent);
      
      // Filter out the old version of this list from the master events array
      const otherEvents = goals.filter(e => {
          if (type === 'legacy') return e.category !== 'legacy';
          if (type === 'expense') return !(e.type === 'expense' && e.category !== 'legacy');
          if (type === 'income') return !(e.type === 'income' && e.category !== 'legacy');
          return true;
      });

      // Merge the reordered sub-list back with the rest of the events
      setConfig(prev => ({ ...prev, events: [...subList, ...otherEvents] }));
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
    dragListType.current = null;
  };

  const lifeExpectancyYear = (config.birthYear || 1970) + (config.lifeExpectancy || 95);

  const legacyTemplates = [
    { name: "Home Down Payment Assistance", type: 'expense', category: 'legacy', amount: 100000, isRecurring: false },
    { name: "Graduated Mortgage Support", type: 'expense', category: 'legacy', amount: 36000, isRecurring: true, duration: 10 },
    { name: "Temporary Rent Assistance", type: 'expense', category: 'legacy', amount: 48000, isRecurring: true, duration: 5 },
    { name: "Estate Inheritance Target", type: 'expense', category: 'legacy', amount: 3500000, isRecurring: false, targetYear: lifeExpectancyYear }
  ];

  const [showTemplates, setShowTemplates] = useState(false);

  const legacyGoals = goals.filter(e => e.category === 'legacy');
  const expenses = goals.filter(e => e.type === 'expense' && e.category !== 'legacy');
  const incomes = goals.filter(e => e.type === 'income' && e.category !== 'legacy');

  const childrenOptions = [
    { id: 'all', name: 'All Children' }, 
    ...(config.childConfigs || []).map(c => ({ id: c.id, name: c.name }))
  ];

  const renderGoalRow = (ev, index, listCategory, typeColor, typeBg, typeLabel) => (
    <div 
      key={ev.id} 
      draggable
      onDragStart={(e) => handleDragStart(e, index, listCategory)}
      onDragEnter={(e) => handleDragEnter(e, index, listCategory)}
      onDragEnd={(e) => handleDragEnd(e, listCategory)}
      onDragOver={(e) => e.preventDefault()}
      className={`border border-slate-200 rounded-2xl p-4 bg-white relative group cursor-grab active:cursor-grabbing ${ev.category === 'legacy' ? 'shadow-sm border-indigo-100' : ''}`}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        <div className="text-slate-300 group-hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing px-1"><GripVertical size={16}/></div>
        <button onClick={() => removeGoal(ev.id)} className="text-slate-300 hover:text-red-500 transition-colors bg-white p-1 rounded-md opacity-0 group-hover:opacity-100 shadow-sm"><Trash2 size={14}/></button>
      </div>
      
      <div className="space-y-3">
        {/* Top Row */}
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="flex-1 min-w-[150px]">
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Description</label>
             <input type="text" value={ev.description} onChange={e => updateGoal(ev.id, 'description', e.target.value)} className={`w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold outline-none focus:border-${ev.category === 'legacy' ? 'indigo' : 'blue'}-400 pr-8 cursor-text`} data-1p-ignore autoComplete="off" />
           </div>
           
           {ev.category === 'legacy' && (
              <div className="w-full sm:w-36 shrink-0">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={10}/> Assign To</label>
                <select
                  value={ev.assignee || 'all'}
                  onChange={e => updateGoal(ev.id, 'assignee', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400 text-slate-700 h-[34px] cursor-pointer"
                >
                  {childrenOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
              </div>
           )}

           <div className="w-full sm:w-32 shrink-0">
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Amount</label>
             <div className="cursor-text">
                <CurrencyInput value={ev.amount} onChange={v => updateGoal(ev.id, 'amount', v)} />
             </div>
           </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-slate-50">
          <div className="w-28 shrink-0">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{ev.isRecurring ? 'Start Yr' : (ev.category === 'legacy' ? 'Target Yr' : 'Year')}</label>
            <div className="cursor-text"><StepperInput value={ev.year} onChange={v => updateGoal(ev.id, 'year', v)} /></div>
          </div>
          
          <div className="flex items-center gap-2 mb-2.5">
            <input type="checkbox" id={`rec-${ev.id}`} checked={ev.isRecurring} onChange={e => updateGoal(ev.id, 'isRecurring', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
            <label htmlFor={`rec-${ev.id}`} className="text-[11px] font-bold text-slate-700 cursor-pointer">{ev.category === 'legacy' ? 'Multi-Year Support' : 'Recurring'}</label>
          </div>

          {ev.isRecurring && ev.category === 'legacy' && (
            <div className="w-28 shrink-0 animate-in fade-in slide-in-from-left-2">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Duration (Yrs)</label>
              <div className="cursor-text">
                 <StepperInput
                   value={Math.max(1, (ev.recurringEndYear || ev.year) - ev.year)}
                   onChange={v => updateGoal(ev.id, 'recurringEndYear', ev.year + v)}
                 />
              </div>
            </div>
          )}

          {ev.isRecurring && ev.category !== 'legacy' && (
            <>
              <div className="w-28 shrink-0 animate-in fade-in slide-in-from-left-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">End Yr</label>
                <div className="cursor-text"><StepperInput value={ev.recurringEndYear} onChange={v => updateGoal(ev.id, 'recurringEndYear', v)} /></div>
              </div>
              <div className="ml-auto flex items-center gap-2 animate-in fade-in slide-in-from-left-2 mb-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Every X Yrs</span>
                <div className="w-24 cursor-text"><StepperInput value={ev.recurringFrequency} onChange={v => updateGoal(ev.id, 'recurringFrequency', v)} /></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12">
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: FAMILY SUPPORT & LEGACY GOALS */}
        <div className="xl:col-span-7 bg-indigo-50/40 p-6 rounded-[32px] shadow-sm border border-indigo-100 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 pb-4 border-b border-indigo-100 gap-4">
            <div>
                <h2 className="text-xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
                  <HeartHandshake size={24} className="text-indigo-600" /> Family Support & Legacy
                </h2>
                <p className="text-indigo-900/60 text-[10px] mt-1 font-bold uppercase tracking-widest">Housing assistance, AI Safety Nets, Estate Transfers</p>
            </div>
            
            <div className="relative">
                <button onClick={() => setShowTemplates(!showTemplates)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap">
                  <Plus size={14} /> Quick Add Goal <ChevronDown size={14} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`}/>
                </button>
                
                {showTemplates && (
                    <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-2 z-50">
                        <div className="p-3 bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Scenario Template</div>
                        {legacyTemplates.map((t, i) => (
                            <button key={i} onClick={() => { addGoal(null, null, t); setShowTemplates(false); }} className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 group transition-colors">
                                <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">{t.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">${t.amount.toLocaleString()} {t.isRecurring ? `/ yr for ${t.duration} yrs` : 'One-time'}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </div>

          <div className="space-y-3">
            {legacyGoals.map((ev, i) => renderGoalRow(ev, i, 'legacy', 'text-indigo-700', 'bg-indigo-100', 'Legacy'))}
            {legacyGoals.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400/70 text-[10px] font-bold uppercase tracking-widest">
                  No active legacy or support goals
                </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DRAWS & INCOME */}
        <div className="xl:col-span-5 space-y-6">
            
            {/* STANDARD EXPENSES */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <CreditCard size={18} className="text-rose-500" /> Standard Capital Draws
                    </h2>
                    <p className="text-slate-400 text-[9px] mt-1 font-bold uppercase tracking-widest">Vehicles, Vacations, Home Repairs</p>
                </div>
                <button onClick={() => addGoal('expense', 'standard')} className="bg-[#e11d48] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-700 transition-colors shadow-sm">
                    <Plus size={12} /> Add
                </button>
                </div>
                <div className="space-y-3">
                {expenses.map((ev, i) => renderGoalRow(ev, i, 'expense', 'text-rose-700', 'bg-rose-100', 'Draw'))}
                {expenses.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-[10px] font-bold uppercase tracking-widest">No capital draws planned</div>
                )}
                </div>
            </div>

            {/* OTHER INCOME */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Banknote size={18} className="text-emerald-500" /> Other Income
                    </h2>
                    <p className="text-slate-400 text-[9px] mt-1 font-bold uppercase tracking-widest">Inheritances, Sale of Assets</p>
                </div>
                <button onClick={() => addGoal('income', 'standard')} className="bg-[#059669] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-sm">
                    <Plus size={12} /> Add
                </button>
                </div>
                <div className="space-y-3">
                {incomes.map((ev, i) => renderGoalRow(ev, i, 'income', 'text-emerald-700', 'bg-emerald-100', 'Income'))}
                {incomes.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-[10px] font-bold uppercase tracking-widest">No other income planned</div>
                )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Goals;