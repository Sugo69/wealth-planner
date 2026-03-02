// --- Global Constants ---
export const BASE_YEAR = 2026;
export const INFLATION_RATE = 0.03;

export const SSI_MULT_PRIMARY = { 62: 0.70, 63: 0.75, 64: 0.80, 65: 0.8667, 66: 0.9333, 67: 1.00, 68: 1.08, 69: 1.16, 70: 1.24 };
export const SSI_MULT_SPOUSAL = { 62: 0.325, 63: 0.35, 64: 0.375, 65: 0.4167, 66: 0.4583, 67: 0.50, 68: 0.50, 69: 0.50, 70: 0.50 };
export const RMD_TABLE = { 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9 };
export const STATE_TAX_RATES = { "WA": 0.0, "UT": 4.55, "CA": 9.3, "NY": 6.85, "FL": 0.0, "TX": 0.0 };

export const generateNormalRandom = (mean, stdDev) => {
  const u1 = Math.random(), u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
};

export const runSimulationCore = (config, events, isMonteCarlo = false, mcSettings = null) => {
  const { 
    birthYear, spouseBirthYear, targetRetirementYear, spouseTargetRetirementYear,
    primaryIsWorking, spouseIsWorking, primaryBonus, spouseBonus, 
    primary401kPreTax, primary401kRoth, primary401kMatch, primary401kMatchMax,
    spouse401kPreTax, spouse401kRoth, spouse401kMatch, spouse401kMatchMax,
    lifeExpectancy, hasSpouse, spouseLifeExpectancy, 
    checkingBalance, savingsBalance, debts,
    portfolioValue, rothBalance, iraBalance, fourOhOneK, hsaBalance,
    growthRate, homeValue, homeAppreciation, goGoSpend, goGoDuration, 
    slowGoSpend, slowGoDuration, noGoSpend, 
    primarySsiAmount, primarySsiAge, spouseSsiAge, spouseSsiAmount, useSpousalSsiRule, 
    phase1Salary, spouseSalary, filingStatus, currentState, destinationState, relocationYear, investmentIncome, 
    capitalGains, perezIntensity, perezCalendarYear, 
    isDownsizing, downsizeCalendarYear, replacementHomeValue, homeSaleFee, hasSsi,
    annualConversionAmount, conversionStartYear, conversionDuration // New Roth Variables
  } = config;

  const pBirthYear = birthYear || 1970;
  const sBirthYear = spouseBirthYear || 1970;
  const currentAge = BASE_YEAR - pBirthYear;
  const spouseAge = BASE_YEAR - sBirthYear;
  const rmdStartAge = pBirthYear >= 1960 ? 75 : 73;

  let curCash = (checkingBalance || 0) + (savingsBalance || 0);
  let curIra = iraBalance || 0, curRoth = rothBalance || 0, curBrokerage = portfolioValue || 0, curHome = homeValue || 0;
  let cur401k = fourOhOneK || 0, curHsa = hsaBalance || 0;
  let activeDebts = (debts || []).map(d => ({ ...d }));

  const maxHorizon = hasSpouse ? Math.max(lifeExpectancy || 95, currentAge + ((spouseLifeExpectancy || 95) - spouseAge)) : (lifeExpectancy || 95);
  const totalMonths = Math.max(0, (maxHorizon - currentAge) * 12);
  
  let path = [], annualTaxData = [], totalRmd = 0, totalTax = 0, irmaaYears = 0, totalSsiIncome = 0, totalBridgeIncome = 0, totalHomeTransactionNet = 0;
  let perezPoint = null, downsizePoint = null, childGiftPoints = [], retirementPoint = null, customEventPoints = [], primarySsiPoint = null, spouseSsiPoint = null;

  for (let month = 0; month <= totalMonths; month++) {
    const yrNum = month / 12, calYr = BASE_YEAR + Math.floor(yrNum), age = parseFloat((currentAge + yrNum).toFixed(1));
    let growth = isMonteCarlo && mcSettings ? generateNormalRandom(growthRate / 100, mcSettings.mcVolatility / 100) : growthRate / 100;
    
    const mGrowth = Math.pow(1 + growth, 1 / 12) - 1;
    const mHomeGrowth = Math.pow(1 + (homeAppreciation / 100), 1 / 12) - 1;
    const mCashGrowth = Math.pow(1 + 0.01, 1 / 12) - 1;

    curCash *= (1 + mCashGrowth);
    curIra *= (1 + mGrowth); curRoth *= (1 + mGrowth); curBrokerage *= (1 + mGrowth); 
    cur401k *= (1 + mGrowth); curHsa *= (1 + mGrowth); curHome *= (1 + mHomeGrowth);

    if (month === (perezCalendarYear - BASE_YEAR) * 12 && perezIntensity > 0) {
      curCash *= (1 - perezIntensity / 100); curIra *= (1 - perezIntensity / 100); curRoth *= (1 - perezIntensity / 100); 
      curBrokerage *= (1 - perezIntensity / 100); cur401k *= (1 - perezIntensity / 100); curHsa *= (1 - perezIntensity / 100); curHome *= (1 - perezIntensity / 100);
      if (!isMonteCarlo) perezPoint = { age, balance: Math.round(curCash + curIra + cur401k + curHsa + curRoth + curBrokerage) };
    }

    const taxState = calYr >= (relocationYear || 2099) ? destinationState : currentState;
    const sRate = STATE_TAX_RATES[taxState] / 100;

    if (isDownsizing && month === (downsizeCalendarYear - BASE_YEAR) * 12) {
      const netSaleProceeds = curHome * (1 - (homeSaleFee || 0) / 100);
      const transactionImpact = netSaleProceeds - replacementHomeValue;
      curBrokerage += transactionImpact; totalHomeTransactionNet += transactionImpact; curHome = replacementHomeValue;
      activeDebts = activeDebts.map(d => d.type === 'Mortgage' ? { ...d, balance: 0 } : d);
      if (!isMonteCarlo) downsizePoint = { age, balance: Math.round(curCash + curIra + cur401k + curHsa + curRoth + curBrokerage) };
    }

    let totalDebtPaymentThisMonth = 0;
    let currentTotalDebt = 0;
    activeDebts.forEach(debt => {
      if (debt.balance > 0) {
        const monthlyInterest = debt.balance * ((debt.interestRate || 0) / 100 / 12);
        const actualPayment = Math.min(debt.balance + monthlyInterest, debt.monthlyPayment || 0);
        debt.balance -= (actualPayment - monthlyInterest);
        totalDebtPaymentThisMonth += actualPayment;
      }
      currentTotalDebt += Math.max(0, debt.balance);
    });

    events.forEach(event => {
      const startMonth = (event.year - BASE_YEAR) * 12;
      let eventActive = false;
      if (!event.isRecurring && month === startMonth) eventActive = true;
      else if (event.isRecurring) {
        const freqMonths = Math.max(1, event.recurringFrequency || 1) * 12;
        const endMonth = ((event.recurringEndYear || event.year) - BASE_YEAR) * 12;
        if (month >= startMonth && month <= endMonth && (month - startMonth) % freqMonths === 0) eventActive = true;
      }
      if (eventActive) {
        if (event.type === 'income') curCash += event.amount; else curBrokerage -= event.amount; 
        if (!isMonteCarlo) customEventPoints.push({ age, balance: Math.round(curCash + curIra + cur401k + curHsa + curRoth + curBrokerage), type: event.type });
      }
    });

    let rmdThisMonth = 0;
    if (month > 0 && month % 12 === 0 && Math.floor(age) >= rmdStartAge) {
      const totalPreTax = curIra + cur401k;
      if (totalPreTax > 0) {
        rmdThisMonth = totalPreTax / (RMD_TABLE[Math.floor(age)] || 10);
        const iraShare = curIra / totalPreTax;
        curIra -= (rmdThisMonth * iraShare);
        cur401k -= (rmdThisMonth * (1 - iraShare));
        curCash += rmdThisMonth;
        totalRmd += rmdThisMonth;
      }
    }

    // --- STRATEGIC ROTH CONVERSIONS ---
    let rothConvThisMonth = 0;
    const convStart = conversionStartYear || BASE_YEAR;
    const convEnd = convStart + (conversionDuration || 0);
    
    if (calYr >= convStart && calYr < convEnd) {
      const targetMonthlyConv = (annualConversionAmount || 0) / 12;
      
      // Pull from IRA first, then 401k if needed
      let remainingConv = targetMonthlyConv;
      
      const iraPull = Math.min(remainingConv, curIra);
      curIra -= iraPull;
      remainingConv -= iraPull;
      
      const kPull = Math.min(remainingConv, cur401k);
      cur401k -= kPull;
      remainingConv -= kPull;
      
      rothConvThisMonth = targetMonthlyConv - remainingConv;
      curRoth += rothConvThisMonth;
    }

    let mInc = 0;
    
    if (hasSsi) {
      const pSsiMultAge = Math.min(70, Math.max(62, primarySsiAge || 67));
      const sSsiMultAge = Math.min(70, Math.max(62, spouseSsiAge || 67));
      const primaryActive = age >= (primarySsiAge || 67);
      const spouseActualAge = spouseAge + yrNum;
      const spouseActive = hasSpouse && (spouseActualAge >= (spouseSsiAge || 67));

      let pSsiActual = 0, spSsiActual = 0;

      if (primaryActive) {
        pSsiActual = (primarySsiAmount || 0) * (SSI_MULT_PRIMARY[pSsiMultAge] || 1);
        mInc += (pSsiActual / 12);
        if (!isMonteCarlo && !primarySsiPoint) primarySsiPoint = { age, balance: Math.round(curCash + curIra + cur401k + curHsa + curRoth + curBrokerage) };
      }

      if (spouseActive) {
        const isSpousalRule = useSpousalSsiRule !== false; 
        if (isSpousalRule && primaryActive) spSsiActual = (primarySsiAmount || 0) * (SSI_MULT_SPOUSAL[sSsiMultAge] || 0.5);
        else if (!isSpousalRule) spSsiActual = (spouseSsiAmount || 0) * (SSI_MULT_PRIMARY[sSsiMultAge] || 1);
        mInc += (spSsiActual / 12);
        if (spSsiActual > 0 && !isMonteCarlo && !spouseSsiPoint) spouseSsiPoint = { age, balance: Math.round(curCash + curIra + cur401k + curHsa + curRoth + curBrokerage) };
      }
      if (!isMonteCarlo) totalSsiIncome += ((pSsiActual + spSsiActual) / 12);
    }
    
    // INSTITUTIONAL 401K & MATCHING LOGIC
    let pRothAdd = 0, sRothAdd = 0;

    if (primaryIsWorking && calYr <= (targetRetirementYear || BASE_YEAR)) {
       const pGross = ((phase1Salary || 0) + (primaryBonus || 0)) / 12;
       const pPreTaxAdd = pGross * ((primary401kPreTax || 0) / 100);
       pRothAdd = pGross * ((primary401kRoth || 0) / 100);
       
       const pEmployeeTotalContrib = pPreTaxAdd + pRothAdd;
       const pTheoreticalMatch = pEmployeeTotalContrib * ((primary401kMatch || 0) / 100);
       const pMonthlyMatchMax = primary401kMatchMax ? (primary401kMatchMax / 12) : Infinity;
       const pMatchAdd = Math.min(pTheoreticalMatch, pMonthlyMatchMax);
       
       cur401k += (pPreTaxAdd + pMatchAdd);
       curRoth += pRothAdd;
       mInc += (pGross - pPreTaxAdd);
       
       if (!isMonteCarlo && calYr === targetRetirementYear && month % 12 === 0) retirementPoint = { age, balance: Math.round(curCash + curIra + cur401k + curHsa + curRoth + curBrokerage) };
    }
    
    if (hasSpouse && spouseIsWorking && calYr <= (spouseTargetRetirementYear || BASE_YEAR)) {
       const sGross = ((spouseSalary || 0) + (spouseBonus || 0)) / 12;
       const sPreTaxAdd = sGross * ((spouse401kPreTax || 0) / 100);
       sRothAdd = sGross * ((spouse401kRoth || 0) / 100);
       
       const sEmployeeTotalContrib = sPreTaxAdd + sRothAdd;
       const sTheoreticalMatch = sEmployeeTotalContrib * ((spouse401kMatch || 0) / 100);
       const sMonthlyMatchMax = spouse401kMatchMax ? (spouse401kMatchMax / 12) : Infinity;
       const sMatchAdd = Math.min(sTheoreticalMatch, sMonthlyMatchMax);
       
       cur401k += (sPreTaxAdd + sMatchAdd);
       curRoth += sRothAdd;
       mInc += (sGross - sPreTaxAdd);
    }

    mInc += ((investmentIncome || 0) + (capitalGains || 0)) / 12;
    if (!isMonteCarlo) totalBridgeIncome += mInc;

    // SURPLUS SWEEP & DRAWDOWN MECHANICS
    let baseSpend = (yrNum < (goGoDuration || 10)) ? (goGoSpend || 0) : (yrNum < (goGoDuration || 10) + (slowGoDuration || 10)) ? (slowGoSpend || 0) : (noGoSpend || 0);
    
    const totalCashNeeds = baseSpend + totalDebtPaymentThisMonth + pRothAdd + sRothAdd;
    const netCashFlow = mInc - totalCashNeeds;

    if (netCashFlow > 0) {
        curBrokerage += netCashFlow;
    }

    let monthlyShortfall = netCashFlow < 0 ? Math.abs(netCashFlow) : 0;
    curCash -= monthlyShortfall;

    // --- TAX CALCULATION (INCLUDING ROTH CONVERSION) ---
    if (month > 0 && month % 12 === 0) {
      // We add the annual Roth conversion amount to the taxable base
      const taxable = rmdThisMonth + (mInc * 12) + (rothConvThisMonth * 12);
      const stdDed = filingStatus === 'MFJ' ? (calYr >= 2026 ? 15000 : 29200) : (calYr >= 2026 ? 7500 : 14600);
      const fTax = Math.max(0, taxable - stdDed) * 0.22; 
      const sTax = taxable * sRate;
      curCash -= (fTax + sTax); totalTax += (fTax + sTax);
    }

    // Asset Liquidation (Triggered if Cash drops below zero from shortfalls or taxes)
    if (curCash < 0) {
      let withdrawalRemaining = Math.abs(curCash);
      curCash = 0;
      
      if (curBrokerage >= withdrawalRemaining) { curBrokerage -= withdrawalRemaining; withdrawalRemaining = 0; } 
      else { 
        withdrawalRemaining -= curBrokerage; curBrokerage = 0;
        if (curHsa >= withdrawalRemaining) { curHsa -= withdrawalRemaining; withdrawalRemaining = 0; }
        else {
          withdrawalRemaining -= curHsa; curHsa = 0;
          if (curRoth >= withdrawalRemaining) { curRoth -= withdrawalRemaining; withdrawalRemaining = 0; } 
          else { 
            withdrawalRemaining -= curRoth; curRoth = 0; 
            if (curIra >= withdrawalRemaining) { curIra -= withdrawalRemaining; withdrawalRemaining = 0; }
            else { curIra = 0; cur401k -= withdrawalRemaining; }
          }
        }
      }
    }

    const currentLiquidBal = curCash + curIra + cur401k + curHsa + curRoth + curBrokerage;

    if (month % 3 === 0 && !isMonteCarlo) {
      path.push({ 
        age, 
        balance: Math.round(currentLiquidBal), 
        ira: Math.round(curIra + cur401k), 
        roth: Math.round(curRoth), 
        brokerage: Math.round(curBrokerage), 
        hsa: Math.round(curHsa), 
        projectedHome: Math.max(0, Math.round(curHome - currentTotalDebt))
      });
    }
    if (isMonteCarlo && month % 12 === 0) path.push({ age: Math.floor(age), balance: currentLiquidBal });
  }
  
  return { 
    data: path, annualTaxData, finalBalance: curCash + curIra + cur401k + curHsa + curRoth + curBrokerage, totalRmd, totalTax, irmaaYears, 
    isBroke: (curCash + curIra + cur401k + curHsa + curRoth + curBrokerage) <= 0,
    perezPoint, downsizePoint, childGiftPoints, retirementPoint, customEventPoints, primarySsiPoint, spouseSsiPoint, 
    totalSsiIncome, totalBridgeIncome, totalHomeTransactionNet, finalHomeVal: curHome
  };
};