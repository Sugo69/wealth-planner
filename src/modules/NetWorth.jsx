import React from 'react';
import { Landmark, PieChart, Home, CreditCard, Plus, Trash2, MapPin } from 'lucide-react';
import { CurrencyInput } from '../components/Inputs';

const NetWorth = ({ config, setConfig }) => {
  const updateProfile = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const debts = config.debts || [];

  const addDebt = () => {
    const newDebt = {
      id: Date.now(),
      name: 'Primary Mortgage',
      type: 'Mortgage',
      balance: 400000,
      interestRate: 4.5,
      monthlyPayment: 3500
    };
    setConfig(prev => ({ ...prev, debts: [...(prev.debts || []), newDebt] }));
  };

  const updateDebt = (id, field, value) => {
    setConfig(prev => ({
      ...prev,
      debts: prev.debts.map(d => d.id === id ? { ...d, [field]: value } : d)
    }));
  };

  const removeDebt = (id) => {
    setConfig(prev => ({ ...prev, debts: prev.debts.filter(d => d.id !== id) }));
  };

  // Quick total calculations
  const totalCash = (config.checkingBalance || 0) + (config.savingsBalance || 0);
  const totalInvestments = (config.portfolioValue || 0) + (config.iraBalance || 0) + (config.fourOhOneK || 0) + (config.rothBalance || 0) + (config.hsaBalance || 0);
  const totalProperty = config.homeValue || 0;
  const totalDebt = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
  const totalNetWorth = (totalCash + totalInvestments + totalProperty) - totalDebt;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header & Summary */}
      <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Net Worth Balance Sheet</h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Categorize your liquid, invested, and illiquid assets against liabilities.</p>
        </div>
        <div className="bg-slate-800/80 px-8 py-4 rounded-3xl border border-slate-700/50 text-center min-w-[200px]">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Net Worth</p>
           <p className="text-3xl font-black text-emerald-400">${(totalNetWorth / 1000000).toFixed(2)}M</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
          
          {/* BANK / LIQUID CASH */}
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Landmark size={16} className="text-blue-500"/> Bank (Liquid)
               </h3>
               <span className="text-sm font-bold text-slate-700">${totalCash.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Checking Accounts</label>
                <CurrencyInput value={config.checkingBalance || 0} onChange={v => updateProfile('checkingBalance', v)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Savings / High-Yield</label>
                <CurrencyInput value={config.savingsBalance || 0} onChange={v => updateProfile('savingsBalance', v)} />
              </div>
            </div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide font-bold italic">
               * Cash deposits are separated from market-exposed growth modeling.
            </p>
          </section>

          {/* INVESTMENTS */}
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <PieChart size={16} className="text-indigo-500"/> Investments
               </h3>
               <span className="text-sm font-bold text-slate-700">${totalInvestments.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Taxable Brokerage</label>
                <CurrencyInput value={config.portfolioValue} onChange={v => updateProfile('portfolioValue', v)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Pre-Tax IRA</label>
                <CurrencyInput value={config.iraBalance} onChange={v => updateProfile('iraBalance', v)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">401k Balance</label>
                <CurrencyInput value={config.fourOhOneK || 0} onChange={v => updateProfile('fourOhOneK', v)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Roth Portfolio</label>
                <CurrencyInput value={config.rothBalance} onChange={v => updateProfile('rothBalance', v)} />
              </div>
              <div className="col-span-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <label className="block text-[10px] font-black text-emerald-600 mb-1.5 uppercase">HSA Balance</label>
                <CurrencyInput value={config.hsaBalance || 0} onChange={v => updateProfile('hsaBalance', v)} />
              </div>
            </div>
          </section>

          {/* REAL ESTATE */}
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Home size={16} className="text-teal-500"/> Property
               </h3>
               <span className="text-sm font-bold text-slate-700">${totalProperty.toLocaleString()}</span>
            </div>
            <div className="space-y-5">
              <div>
                 <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Primary Home Value</label>
                 <CurrencyInput value={config.homeValue} onChange={v => updateProfile('homeValue', v)} />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                 <MapPin size={16} className="text-slate-400" />
                 <div>
                     <p className="text-[9px] font-black uppercase text-slate-400 leading-none">Baseline Tax Jurisdiction</p>
                     <p className="text-sm font-bold text-slate-700">Washington State (0% Income Tax)</p>
                 </div>
              </div>
            </div>
          </section>

          {/* DEBTS & LIABILITIES */}
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <CreditCard size={16} className="text-rose-500"/> Liabilities (Loans)
               </h3>
               <div className="flex items-center gap-3">
                 <span className="text-sm font-bold text-rose-500">-${totalDebt.toLocaleString()}</span>
                 <button onClick={addDebt} className="bg-rose-50 text-rose-600 px-2 py-1 rounded border border-rose-100 text-[9px] font-black uppercase hover:bg-rose-100 transition-colors">
                   + Add
                 </button>
               </div>
            </div>
            <div className="space-y-4">
              {debts.map((debt) => (
                <div key={debt.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl relative group">
                  <button onClick={() => removeDebt(debt.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Loan Name</label>
                      <input 
                        type="text" 
                        value={debt.name} 
                        onChange={e => updateDebt(debt.id, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold outline-none focus:border-rose-400"
                        data-1p-ignore autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Current Balance</label>
                      <CurrencyInput value={debt.balance} onChange={v => updateDebt(debt.id, 'balance', v)} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase">Mo. Payment</label>
                      <CurrencyInput value={debt.monthlyPayment} onChange={v => updateDebt(debt.id, 'monthlyPayment', v)} />
                    </div>
                  </div>
                </div>
              ))}
              {debts.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No active debts
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default NetWorth;