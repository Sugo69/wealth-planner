export const defaultConfig = {
  currentAge: 55, lifeExpectancy: 95, hasSpouse: true, spouseAge: 53, spouseLifeExpectancy: 95,
  perezIntensity: 15, perezCalendarYear: 2029, portfolioValue: 1000000, rothBalance: 0, iraBalance: 1000000,
  growthRate: 7, homeValue: 1200000, homeAppreciation: 2, 
  isDownsizing: false, downsizeCalendarYear: 2030, replacementHomeValue: 500000, homeSaleFee: 5,
  goGoSpend: 10000, goGoDuration: 10, slowGoSpend: 8500, slowGoDuration: 10, noGoSpend: 7500,
  desiredLegacy: 1500000, numChildren: 2, childConfigs: [
    { id: 1, name: "Child 1", monthly: 0, supportDuration: 0, supportStartYear: 2026, grantCalendarYear: 2026, giftAmount: 0 },
    { id: 2, name: "Child 2", monthly: 0, supportDuration: 0, supportStartYear: 2026, grantCalendarYear: 2028, giftAmount: 0 },
    { id: 3, name: "Child 3", monthly: 0, supportDuration: 0, supportStartYear: 2026, grantCalendarYear: 2030, giftAmount: 0 },
    { id: 4, name: "Child 4", monthly: 0, supportDuration: 0, supportStartYear: 2026, grantCalendarYear: 2032, giftAmount: 0 },
    { id: 5, name: "Child 5", monthly: 0, supportDuration: 0, supportStartYear: 2026, grantCalendarYear: 2034, giftAmount: 0 }
  ],
  hasSsi: true, primarySsiAmount: 36000, primarySsiAge: 67, spouseSsiAmount: 18000, spouseSsiAge: 67,
  useSpousalSsiRule: false,
  isWorking: true, phase1Salary: 150000, phase1Duration: 5, phase2Salary: 40000, phase2Duration: 5, spouseSalary: 0, spouseDuration: 0,
  filingStatus: 'MFJ', currentState: 'WA', destinationState: 'UT', relocationYear: 2030,
  investmentIncome: 15000, capitalGains: 10000,
  rothConversionStrategy: 'none', annualConversionAmount: 50000, conversionStartYear: 2026, conversionDuration: 5, targetMarginalBracket: 24
};