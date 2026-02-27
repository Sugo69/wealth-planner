import React from 'react';
import { Trash2 } from 'lucide-react';
import { CurrencyInput, NumericInput, StepperInput } from './Inputs';

export const EventRow = React.memo(({ event, onUpdate, onRemove }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 items-start shadow-sm transition-all hover:bg-slate-100/50">
    <div className="md:col-span-2">
      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Type</label>
      <div className={`p-2 rounded-lg text-[10px] font-black uppercase text-center ${event.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{event.type}</div>
      <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 mt-3 cursor-pointer hover:text-blue-600">
        <input type="checkbox" checked={event.isRecurring || false} onChange={(e) => onUpdate(event.id, 'isRecurring', e.target.checked)} className="accent-blue-600 w-3 h-3 cursor-pointer" /> Recurring
      </label>
    </div>
    <div className="md:col-span-4 flex flex-col justify-center">
      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Description</label>
      <input type="text" value={event.label} onChange={(e) => onUpdate(event.id, 'label', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-1 ring-blue-500" />
      <div className="flex gap-4 mt-3">
        {[1, 2, 3].map(slot => (
          <label key={slot} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 cursor-pointer hover:text-blue-600">
            <input type="checkbox" checked={event.applicableSlots?.includes(slot) ?? true} onChange={(e) => { const current = event.applicableSlots ?? [1, 2, 3]; const newSlots = e.target.checked ? [...current, slot] : current.filter(s => s !== slot); onUpdate(event.id, 'applicableSlots', newSlots); }} className="accent-blue-600 w-3 h-3" /> Case {slot}
          </label>
        ))}
      </div>
    </div>
    <div className="md:col-span-2">
      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Amount</label>
      <CurrencyInput value={event.amount} onChange={(val) => onUpdate(event.id, 'amount', val)} />
    </div>
    <div className="md:col-span-3 space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">{event.isRecurring ? 'Start Yr' : 'Year'}</label>
          <NumericInput value={event.year} onChange={(val) => onUpdate(event.id, 'year', val)} />
        </div>
        {event.isRecurring && (
          <div className="flex-1">
            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">End Yr</label>
            <NumericInput value={event.recurringEndYear || (event.year + 10)} onChange={(val) => onUpdate(event.id, 'recurringEndYear', val)} />
          </div>
        )}
      </div>
      {event.isRecurring && (
         <div className="animate-in fade-in">
           <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Every X Years</label>
           <StepperInput value={event.recurringFrequency || 1} onChange={(val) => onUpdate(event.id, 'recurringFrequency', val)} />
         </div>
      )}
    </div>
    <div className="md:col-span-1 flex justify-center pt-5 md:pt-0">
      <button onClick={() => onRemove(event.id)} className="p-2 mt-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
    </div>
  </div>
));