// --- Global Constants ---
export const BASE_YEAR = 2026;
export const INFLATION_RATE = 0.03;

// IRS RMD Uniform Lifetime Table (Age 73+)
export const RMD_TABLE = { 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9 };

// --- State Tax Data ---
export const STATE_TAX_RATES = {
  "WA": 0.0, "UT": 4.55, "CA": 9.3, "NY": 6.85, "FL": 0.0, "TX": 0.0
};

export const generateNormalRandom = (mean, stdDev) => {
  const u1 = Math.random(), u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
};

export const runSimulationCore = (config, events, isMonteCarlo = false, mcSettings = null) => {
  const { currentAge, lifeExpectancy, hasSpouse, spouseAge, spouseLifeExpectancy, portfolioValue, rothBalance, iraBalance, growthRate, homeValue, homeAppreciation, goGoSpend, goGoDuration, slowGoSpend, slowGoDuration, noGoSpend, primarySsiAmount, primarySsiAge, spouseSsiAmount, spouseSsiAge, phase1Salary, phase1Duration, phase2Salary, phase2Duration, spouseSalary, spouseDuration, isWorking, filingStatus, currentState, destinationState, relocationYear, investmentIncome, capitalGains, rothConversionStrategy, annualConversionAmount, conversionStartYear, conversionDuration, targetMarginalBracket, perezIntensity, perezCalendarYear, isDownsizing, downsizeCalendarYear, replacementHomeValue, homeSaleFee, numChildren, childConfigs, hasSsi } = config;

  let curIra = iraBalance || 0, curRoth = rothBalance || 0, curBrokerage = portfolioValue || 0, curHome = homeValue || 0;
  const maxHorizon = hasSpouse ? Math.max(lifeExpectancy, currentAge + (spouseLifeExpectancy - spouseAge)) : lifeExpectancy;
  const totalMonths = Math.max(0, (maxHorizon - currentAge) * 12);
  
  // Secure 2.0 RMD Age (Simplification for model: 73 if born 1951-1959, 75 if >= 1960)
  const birthYear = BASE_YEAR - currentAge;
  const rmdStartAge = birthYear >= 1960 ? 75 : 73;

  let path = [], annualTaxData = [], totalRmd = 0, totalTax = 0, irmaaYears = 0, totalSsiIncome = 0, totalBridgeIncome = 0, totalHomeTransactionNet = 0;
  let perezPoint = null, downsizePoint = null, childGiftPoints = [], retirementPoint = null, customEventPoints = [], primarySsiPoint = null, spouseSsiPoint = null;

  const targetPerezMonth = (perezCalendarYear - BASE_YEAR) * 12;

  for (let month = 0; month <= totalMonths; month++) {
    const yrNum = month / 12, calYr = BASE_YEAR + Math.floor(yrNum), age = parseFloat((currentAge + yrNum).toFixed(1));
    let growth = isMonteCarlo && mcSettings ? generateNormalRandom(growthRate / 100, mcSettings.mcVolatility / 100) : growthRate / 100;
    const mGrowth = Math.pow(1 + growth, 1 / 12) - 1;
    const mHomeGrowth = Math.pow(1 + (homeAppreciation / 100), 1 / 12) - 1;

    // Compound
    curIra *= (1 + mGrowth); curRoth *= (1 + mGrowth); curBrokerage *= (1 + mGrowth); curHome *= (1 + mHomeGrowth);

    // Perez Reset
    if (month === targetPerezMonth && perezIntensity > 0) {
      curIra *= (1 - perezIntensity / 100); curRoth *= (1 - perezIntensity / 100); curBrokerage *= (1 - perezIntensity / 100); curHome *= (1 - perezIntensity / 100);
      if (!isMonteCarlo) perezPoint = { age, balance: Math.round(curIra + curRoth + curBrokerage) };
    }

    // Relocation & Downsize
    const taxState = calYr >= relocationYear ? destinationState : currentState;
    const sRate = STATE_TAX_RATES[taxState] / 100;

    if (isDownsizing && month === (downsizeCalendarYear - BASE_YEAR) * 12) {
      const netSaleProceeds = curHome * (1 - (homeSaleFee || 0) / 100);
      const transactionImpact = netSaleProceeds - replacementHomeValue;
      curBrokerage += transactionImpact; totalHomeTransactionNet += transactionImpact; curHome = replacementHomeValue;
      if (!isMonteCarlo) downsizePoint = { age, balance: Math.round(curIra + curRoth + curBrokerage) };
    }

    // Child Grants & Custom Events
    childConfigs.slice(0, numChildren).forEach(child => {
      if (month === (child.grantCalendarYear - BASE_YEAR) * 12) {
        curBrokerage -= (child.giftAmount || 0);
        if (!isMonteCarlo && child.giftAmount > 0) childGiftPoints.push({ age, balance: Math.round(curIra + curRoth + curBrokerage) });
      }
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
        if (event.type === 'income') curBrokerage += event.amount; else curBrokerage -= event.amount;
        if (!isMonteCarlo) customEventPoints.push({ age, balance: Math.round(curIra + curRoth + curBrokerage), type: event.type });
      }
    });

    // RMD logic (SECURE 2.0)
    let rmdThisMonth = 0;
    if (month > 0 && month % 12 === 0 && Math.floor(age) >= rmdStartAge) {
      rmdThisMonth = curIra / (RMD_TABLE[Math.floor(age)] || 10);
      curIra -= rmdThisMonth; curBrokerage += rmdThisMonth; totalRmd += rmdThisMonth;
    }

    // Income (Wages, SSI, Investments)
    let mInc = 0;
    if (hasSsi) {
      if (age >= primarySsiAge) { mInc += (primarySsiAmount / 12); if (!isMonteCarlo && !primarySsiPoint) primarySsiPoint = { age, balance: Math.round(curIra + curRoth + curBrokerage) }; }
      if (hasSpouse && (spouseAge + yrNum) >= spouseSsiAge) { mInc += (spouseSsiAmount / 12); if (!isMonteCarlo && !spouseSsiPoint) spouseSsiPoint = { age, balance: Math.round(curIra + curRoth + curBrokerage) }; }
    }
    
    if (isWorking) {
      if (yrNum < phase1Duration) mInc += phase1Salary / 12;
      else if (yrNum < phase1Duration + phase2Duration) mInc += phase2Salary / 12;
      if (hasSpouse && yrNum < spouseDuration) mInc += spouseSalary / 12;
      if (!isMonteCarlo) {
         if (month === Math.round(Math.max(phase1Duration + phase2Duration, hasSpouse ? spouseDuration : 0) * 12)) retirementPoint = { age, balance: Math.round(curIra + curRoth + curBrokerage) };
      }
    }

    // Additional investment income explicitly pulled into the model
    mInc += (investmentIncome + capitalGains) / 12;
    
    if (!isMonteCarlo) { totalSsiIncome += (hasSsi && age >= primarySsiAge ? primarySsiAmount/12 : 0); totalBridgeIncome += mInc; }

    // Roth Conversions (Only converted from IRA to Roth. Tax is paid via Brokerage later).
    let convThisMonth = 0;
    if (calYr >= conversionStartYear && calYr < (conversionStartYear + conversionDuration)) {
      if (month % 12 === 0 && curIra > 0) {
        if (rothConversionStrategy === 'annual') {
          convThisMonth = Math.min(curIra, annualConversionAmount);
        } else if (rothConversionStrategy === 'bracket') {
          const expectedAnnualIncome = (mInc * 12) + rmdThisMonth;
          const stdDed = filingStatus === 'MFJ' ? (calYr >= 2026 ? 15000 : 29200) : (calYr >= 2026 ? 7500 : 14600);
          const baseTaxable = Math.max(0, expectedAnnualIncome - stdDed);
          
          let bracketCeiling = 0;
          if (targetMarginalBracket === 22) bracketCeiling = filingStatus === 'MFJ' ? 201050 : 100525;
          else if (targetMarginalBracket === 24) bracketCeiling = filingStatus === 'MFJ' ? 383900 : 191950;
          
          let room = Math.max(0, bracketCeiling - baseTaxable);
          convThisMonth = Math.min(curIra, room);
        }
        curIra -= convThisMonth; curRoth += convThisMonth;
      }
    }

    let spendMultiplier = 1;
    if (isMonteCarlo && mcSettings) {
       const annualInflationVariance = generateNormalRandom(0, mcSettings.mcInflationStd / 100);
       spendMultiplier = Math.pow(1 + annualInflationVariance, yrNum);
    }
    let baseSpend = (yrNum < goGoDuration) ? goGoSpend : (yrNum < goGoDuration + slowGoDuration) ? slowGoSpend : noGoSpend;
    baseSpend *= spendMultiplier;

    const support = childConfigs.slice(0, numChildren).reduce((sum, child) => {
      const startMonth = (child.supportStartYear - BASE_YEAR) * 12;
      const endMonth = startMonth + (child.supportDuration * 12);
      return sum + (month >= startMonth && month < endMonth ? child.monthly : 0);
    }, 0);

    const netDraw = Math.max(0, (baseSpend + support) - mInc);

    // Taxes & Data Logging
    if (month % 12 === 0) {
      const taxable = rmdThisMonth + convThisMonth + (mInc * 12);
      const stdDed = filingStatus === 'MFJ' ? (calYr >= 2026 ? 15000 : 29200) : (calYr >= 2026 ? 7500 : 14600);
      const fTax = Math.max(0, taxable - stdDed) * (calYr >= 2026 ? 0.25 : 0.22); // Simplified effective engine
      const sTax = taxable * sRate;
      
      let tier = 0;
      if (filingStatus === 'MFJ') {
          if (taxable > 750000) tier = 5;
          else if (taxable > 386000) tier = 4;
          else if (taxable > 322000) tier = 3;
          else if (taxable > 258000) tier = 2;
          else if (taxable > 206000) tier = 1;
      } else {
          if (taxable > 500000) tier = 5;
          else if (taxable > 193000) tier = 4;
          else if (taxable > 161000) tier = 3;
          else if (taxable > 129000) tier = 2;
          else if (taxable > 103000) tier = 1;
      }
      
      curBrokerage -= (fTax + sTax); totalTax += (fTax + sTax);
      if (tier > 0) irmaaYears++;

      if (!isMonteCarlo) {
        annualTaxData.push({
           age: Math.floor(age),
           year: calYr,
           rmd: rmdThisMonth,
           conversion: convThisMonth,
           taxPaid: fTax + sTax,
           irmaaTier: tier
        });
      }
    }

    // Drawdown - Sequenced: Brokerage -> Roth -> IRA
    let withdrawalRemaining = netDraw;
    if (curBrokerage >= withdrawalRemaining) { curBrokerage -= withdrawalRemaining; withdrawalRemaining = 0; } 
    else { withdrawalRemaining -= curBrokerage; curBrokerage = 0;
      if (curRoth >= withdrawalRemaining) { curRoth -= withdrawalRemaining; withdrawalRemaining = 0; } 
      else { withdrawalRemaining -= curRoth; curRoth = 0; curIra -= withdrawalRemaining; }
    }

    if (month % 3 === 0 && !isMonteCarlo) {
      path.push({ age, balance: Math.round(curIra + curRoth + curBrokerage), ira: Math.round(curIra), roth: Math.round(curRoth), brokerage: Math.round(curBrokerage), projectedHome: Math.round(curHome), withdrawalRate: (curIra + curRoth + curBrokerage) > 0 ? ((netDraw * 12) / (curIra + curRoth + curBrokerage) * 100).toFixed(1) : 0 });
    }
    if (isMonteCarlo && month % 12 === 0) path.push({ age: Math.floor(age), balance: curIra + curRoth + curBrokerage });
  }
  
  return { 
    data: path, annualTaxData, finalBalance: curIra + curRoth + curBrokerage, totalRmd, totalTax, irmaaYears, isBroke: (curIra + curRoth + curBrokerage) <= 0,
    perezPoint, downsizePoint, childGiftPoints, retirementPoint, customEventPoints, primarySsiPoint, spouseSsiPoint, totalSsiIncome, totalBridgeIncome, totalHomeTransactionNet, finalHomeVal: curHome
  };
};