import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Line, ComposedChart, BarChart, Bar } from 'recharts';
import { ShieldAlert, Home, Briefcase, DollarSign, PieChart, User, Coffee, Zap, Moon, Heart, Users, Save, RefreshCw, Wallet, LogOut, Plus, LayoutDashboard, ListTree, Banknote, CreditCard, ChevronDown, Binary, Activity, Loader2, Sparkles, TableProperties, Landmark, AlertTriangle, MapPin, Target, Lock, Scale, Calculator, Printer } from 'lucide-react';
// --- Imported Modules ---
import ComparisonView from './components/ComparisonView';
import { auth, db, appId, signInWithCustomToken, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, doc, setDoc, getDoc } from './services/firebase';
import { encryptData, decryptData } from './utils/encryption';
import { runSimulationCore, BASE_YEAR, STATE_TAX_RATES } from './engine/simulationCore';
import { CurrencyInput, NumericInput, StepperInput, formatUSD } from './components/Inputs';
import { EventRow } from './components/EventRow';
import { StarMarker, SsiMarker, CustomizedAxisTick } from './components/ChartMarkers';

// --- Default Configuration ---
const defaultConfig = {
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
  isWorking: true, phase1Salary: 150000, phase1Duration: 5, phase2Salary: 40000, phase2Duration: 5, spouseSalary: 0, spouseDuration: 0,
  filingStatus: 'MFJ', currentState: 'WA', destinationState: 'UT', relocationYear: 2030,
  investmentIncome: 15000, capitalGains: 10000,
  rothConversionStrategy: 'none', annualConversionAmount: 50000, conversionStartYear: 2026, conversionDuration: 5, targetMarginalBracket: 24
};

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [activeSlot, setActiveSlot] = useState(1);
  const [allCasesData, setAllCasesData] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle');
  const [strategyNames, setStrategyNames] = useState({ 1: 'Option 1', 2: 'Option 2', 3: 'Option 3' });
  const [globalEvents, setGlobalEvents] = useState([]);
  const [savedGlobalEvents, setSavedGlobalEvents] = useState([]);
  
  // Security
  const [importModal, setImportModal] = useState({ isOpen: false, fileContent: null, error: '', tempKey: '' });
  const [exportModal, setExportModal] = useState({ isOpen: false, tempKey: '' });

  // Core Inputs
  const [currentAge, setCurrentAge] = useState(defaultConfig.currentAge);
  const [lifeExpectancy, setLifeExpectancy] = useState(defaultConfig.lifeExpectancy);
  const [hasSpouse, setHasSpouse] = useState(defaultConfig.hasSpouse);
  const [spouseAge, setSpouseAge] = useState(defaultConfig.spouseAge);
  const [spouseLifeExpectancy, setSpouseLifeExpectancy] = useState(defaultConfig.spouseLifeExpectancy);
  const [perezIntensity, setPerezIntensity] = useState(defaultConfig.perezIntensity); 
  const [perezCalendarYear, setPerezCalendarYear] = useState(defaultConfig.perezCalendarYear); 
  const [portfolioValue, setPortfolioValue] = useState(defaultConfig.portfolioValue);
  const [rothBalance, setRothBalance] = useState(defaultConfig.rothBalance);
  const [iraBalance, setIraBalance] = useState(defaultConfig.iraBalance);
  const [growthRate, setGrowthRate] = useState(defaultConfig.growthRate); 
  const [homeValue, setHomeValue] = useState(defaultConfig.homeValue);
  const [homeAppreciation, setHomeAppreciation] = useState(defaultConfig.homeAppreciation); 
  const [isDownsizing, setIsDownsizing] = useState(defaultConfig.isDownsizing);
  const [downsizeCalendarYear, setDownsizeCalendarYear] = useState(defaultConfig.downsizeCalendarYear); 
  const [replacementHomeValue, setReplacementHomeValue] = useState(defaultConfig.replacementHomeValue); 
  const [homeSaleFee, setHomeSaleFee] = useState(defaultConfig.homeSaleFee);
  const [goGoSpend, setGoGoSpend] = useState(defaultConfig.goGoSpend); 
  const [goGoDuration, setGoGoDuration] = useState(defaultConfig.goGoDuration); 
  const [slowGoSpend, setSlowGoSpend] = useState(defaultConfig.slowGoSpend); 
  const [slowGoDuration, setSlowGoDuration] = useState(defaultConfig.slowGoDuration);
  const [noGoSpend, setNoGoSpend] = useState(defaultConfig.noGoSpend); 
  const [desiredLegacy, setDesiredLegacy] = useState(defaultConfig.desiredLegacy);
  const [numChildren, setNumChildren] = useState(defaultConfig.numChildren);
  const [childConfigs, setChildConfigs] = useState(defaultConfig.childConfigs);
  const [hasSsi, setHasSsi] = useState(defaultConfig.hasSsi);
  const [primarySsiAmount, setPrimarySsiAmount] = useState(defaultConfig.primarySsiAmount);
  const [primarySsiAge, setPrimarySsiAge] = useState(defaultConfig.primarySsiAge);
  const [spouseSsiAmount, setSpouseSsiAmount] = useState(defaultConfig.spouseSsiAmount);
  const [spouseSsiAge, setSpouseSsiAge] = useState(defaultConfig.spouseSsiAge);
  const [useSpousalSsiRule, setUseSpousalSsiRule] = useState(false);
  const [isWorking, setIsWorking] = useState(defaultConfig.isWorking);
  const [phase1Salary, setPhase1Salary] = useState(defaultConfig.phase1Salary); 
  const [phase1Duration, setPhase1Duration] = useState(defaultConfig.phase1Duration);
  const [phase2Salary, setPhase2Salary] = useState(defaultConfig.phase2Salary);
  const [phase2Duration, setPhase2Duration] = useState(defaultConfig.phase2Duration);
  const [spouseSalary, setSpouseSalary] = useState(defaultConfig.spouseSalary);
  const [spouseDuration, setSpouseDuration] = useState(defaultConfig.spouseDuration);
  
  // Tax & Relocation
  const [filingStatus, setFilingStatus] = useState(defaultConfig.filingStatus);
  const [currentState, setCurrentState] = useState(defaultConfig.currentState);
  const [destinationState, setDestinationState] = useState(defaultConfig.destinationState);
  const [relocationYear, setRelocationYear] = useState(defaultConfig.relocationYear);
  const [investmentIncome, setInvestmentIncome] = useState(defaultConfig.investmentIncome);
  const [capitalGains, setCapitalGains] = useState(defaultConfig.capitalGains);
  const [rothConversionStrategy, setRothConversionStrategy] = useState(defaultConfig.rothConversionStrategy);
  const [annualConversionAmount, setAnnualConversionAmount] = useState(defaultConfig.annualConversionAmount);
  const [conversionStartYear, setConversionStartYear] = useState(defaultConfig.conversionStartYear);
  const [conversionDuration, setConversionDuration] = useState(defaultConfig.conversionDuration);
  const [targetMarginalBracket, setTargetMarginalBracket] = useState(defaultConfig.targetMarginalBracket);

  // Engine state
  const [mcSimCount, setMcSimCount] = useState(1000);
  const [mcVolatility, setMcVolatility] = useState(12);
  const [mcInflationStd, setMcInflationStd] = useState(1.5);
  const [mcData, setMcData] = useState(null);
  const [isCalculatingMC, setIsCalculatingMC] = useState(false);
  
  // AI Advisor State
  const [aiInsight, setAiInsight] = useState(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [userAiQuestion, setUserAiQuestion] = useState("");
  const [taxAiInsight, setTaxAiInsight] = useState(null);
  const [isGeneratingTaxInsight, setIsGeneratingTaxInsight] = useState(false);

  const fileInputRef = useRef(null);

// Sync Spouse SSI to 50% of Primary when rule is active
useEffect(() => {
  if (useSpousalSsiRule) {
    setSpouseSsiAmount(primarySsiAmount / 2);
  }
}, [primarySsiAmount, useSpousalSsiRule]);
  
const currentActiveConfig = useMemo(() => ({
  // Core Demographics
  currentAge, lifeExpectancy, hasSpouse, spouseAge, spouseLifeExpectancy, 
  
  // Financial Assets
  portfolioValue, rothBalance, iraBalance, growthRate,
  
  // Real Estate
  homeValue, homeAppreciation, isDownsizing, downsizeCalendarYear, 
  replacementHomeValue, homeSaleFee,
  
  // Tech Disruption & Risk
  perezIntensity, perezCalendarYear,
  
  // Spending Tiers (The missing links)
  goGoSpend, goGoDuration, slowGoSpend, slowGoDuration, noGoSpend,
  
  // Legacy & Family
  desiredLegacy, numChildren, childConfigs,
  
  // Income Sources
  hasSsi, primarySsiAmount, primarySsiAge, spouseSsiAmount, spouseSsiAge, useSpousalSsiRule,
  isWorking, phase1Salary, phase1Duration, phase2Salary, phase2Duration, 
  spouseSalary, spouseDuration,
  
  // Tax Strategy
  filingStatus, currentState, destinationState, relocationYear, 
  investmentIncome, capitalGains, rothConversionStrategy, 
  annualConversionAmount, conversionStartYear, conversionDuration, 
  targetMarginalBracket
}), [
  annualConversionAmount, conversionStartYear, conversionDuration, targetMarginalBracket, 
  currentAge, lifeExpectancy, hasSpouse, spouseAge, spouseLifeExpectancy, useSpousalSsiRule,
  perezIntensity, perezCalendarYear, portfolioValue, rothBalance, iraBalance, 
  growthRate, homeValue, homeAppreciation, isDownsizing, downsizeCalendarYear, 
  replacementHomeValue, homeSaleFee, goGoSpend, goGoDuration, slowGoSpend, 
  slowGoDuration, noGoSpend, desiredLegacy, numChildren, childConfigs, 
  hasSsi, primarySsiAmount, primarySsiAge, spouseSsiAmount, spouseSsiAge, 
  isWorking, phase1Salary, phase1Duration, phase2Salary, phase2Duration, 
  spouseSalary, spouseDuration, filingStatus, currentState, destinationState, 
  relocationYear, investmentIncome, capitalGains, rothConversionStrategy
]);

  const applyConfigToState = useCallback((data) => {
    if (!data) return;
    setCurrentAge(data.currentAge ?? defaultConfig.currentAge);
    setLifeExpectancy(data.lifeExpectancy ?? defaultConfig.lifeExpectancy);
    setHasSpouse(data.hasSpouse ?? defaultConfig.hasSpouse);
    setSpouseAge(data.spouseAge ?? defaultConfig.spouseAge);
    setSpouseLifeExpectancy(data.spouseLifeExpectancy ?? defaultConfig.spouseLifeExpectancy);
    setPerezIntensity(data.perezIntensity ?? defaultConfig.perezIntensity);
    setPerezCalendarYear(data.perezCalendarYear ?? defaultConfig.perezCalendarYear);
    setPortfolioValue(data.portfolioValue ?? defaultConfig.portfolioValue);
    setRothBalance(data.rothBalance ?? defaultConfig.rothBalance);
    setIraBalance(data.iraBalance ?? defaultConfig.iraBalance);
    setGrowthRate(data.growthRate ?? defaultConfig.growthRate);
    setHomeValue(data.homeValue ?? defaultConfig.homeValue);
    setHomeAppreciation(data.homeAppreciation ?? defaultConfig.homeAppreciation);
    setIsDownsizing(data.isDownsizing ?? defaultConfig.isDownsizing);
    setDownsizeCalendarYear(data.downsizeCalendarYear ?? defaultConfig.downsizeCalendarYear);
    setReplacementHomeValue(data.replacementHomeValue ?? defaultConfig.replacementHomeValue);
    setNumChildren(data.numChildren ?? defaultConfig.numChildren);
    setHomeSaleFee(data.homeSaleFee ?? defaultConfig.homeSaleFee);
    setGoGoSpend(data.goGoSpend ?? defaultConfig.goGoSpend);
    setGoGoDuration(data.goGoDuration ?? defaultConfig.goGoDuration);
    setSlowGoSpend(data.slowGoSpend ?? defaultConfig.slowGoSpend);
    setSlowGoDuration(data.slowGoDuration ?? defaultConfig.slowGoDuration);
    setNoGoSpend(data.noGoSpend ?? defaultConfig.noGoSpend);
    setDesiredLegacy(data.desiredLegacy ?? defaultConfig.desiredLegacy);
    setNumChildren(data.numChildren ?? defaultConfig.numChildren);
    setUseSpousalSsiRule(data.useSpousalSsiRule ?? false);

    const importedChildren = data.childConfigs || [];
    const paddedChildren = defaultConfig.childConfigs.map((defaultChild, index) => importedChildren[index] ? importedChildren[index] : defaultChild);
    setChildConfigs(paddedChildren);

    setHasSsi(data.hasSsi ?? defaultConfig.hasSsi);
    setPrimarySsiAmount(data.primarySsiAmount ?? defaultConfig.primarySsiAmount);
    setPrimarySsiAge(data.primarySsiAge ?? defaultConfig.primarySsiAge);
    setSpouseSsiAmount(data.spouseSsiAmount ?? defaultConfig.spouseSsiAmount);
    setSpouseSsiAge(data.spouseSsiAge ?? defaultConfig.spouseSsiAge);
    setIsWorking(data.isWorking ?? defaultConfig.isWorking);
    setPhase1Salary(data.phase1Salary ?? defaultConfig.phase1Salary);
    setPhase1Duration(data.phase1Duration ?? defaultConfig.phase1Duration);
    setPhase2Salary(data.phase2Salary ?? defaultConfig.phase2Salary);
    setPhase2Duration(data.phase2Duration ?? defaultConfig.phase2Duration);
    setSpouseSalary(data.spouseSalary ?? defaultConfig.spouseSalary);
    setSpouseDuration(data.spouseDuration ?? defaultConfig.spouseDuration);

    setFilingStatus(data.filingStatus ?? defaultConfig.filingStatus);
    setCurrentState(data.currentState ?? defaultConfig.currentState);
    setDestinationState(data.destinationState ?? defaultConfig.destinationState);
    setRelocationYear(data.relocationYear ?? defaultConfig.relocationYear);
    setInvestmentIncome(data.investmentIncome ?? defaultConfig.investmentIncome);
    setCapitalGains(data.capitalGains ?? defaultConfig.capitalGains);
    setRothConversionStrategy(data.rothConversionStrategy ?? defaultConfig.rothConversionStrategy);
    setAnnualConversionAmount(data.annualConversionAmount ?? defaultConfig.annualConversionAmount);
    setConversionStartYear(data.conversionStartYear ?? defaultConfig.conversionStartYear);
    setConversionDuration(data.conversionDuration ?? defaultConfig.conversionDuration);
    setTargetMarginalBracket(data.targetMarginalBracket ?? defaultConfig.targetMarginalBracket);
  }, []);

  // --- Auth & Data Lifecycle ---
  useEffect(() => {
    const init = async () => { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token); else await signInAnonymously(auth); };
    init();
    const unsub = onAuthStateChanged(auth, setUser); return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchAllData = async () => {
      try {
        const newAllCases = {};
        for (let i of [1, 2, 3]) {
          const docSnap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'saved_strategies', i.toString()));
          if (docSnap.exists()) newAllCases[i] = docSnap.data();
        }
        setAllCasesData(newAllCases);
        const namesDoc = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'strategy_names'));
        if (namesDoc.exists()) setStrategyNames(namesDoc.data());
        const eventsDoc = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'global_events'));
        if (eventsDoc.exists()) { setGlobalEvents(eventsDoc.data().events || []); setSavedGlobalEvents(eventsDoc.data().events || []); }
        if (newAllCases[activeSlot]) applyConfigToState(newAllCases[activeSlot]);
      } catch(err) { console.error(err); }
    };
    fetchAllData();
  }, [user, activeSlot, applyConfigToState]);

  const saveCurrentStrategy = useCallback(async (slotOverride = null) => {
  if (!user) return;
  setSaveStatus('saving'); // 1. Changes button to "Syncing..."
  const target = slotOverride || activeSlot;
  try {
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'saved_strategies', target.toString()), { 
      ...currentActiveConfig, 
      updatedAt: new Date().toISOString() 
    });
    
    // ... keep your strategyNames and globalEvents setDoc lines here ...

    setAllCasesData(prev => ({...prev, [target]: currentActiveConfig}));
    setSavedGlobalEvents(globalEvents);
    
    setSaveStatus('saved'); // 2. Changes button to "Saved" (Green)
    setTimeout(() => setSaveStatus('idle'), 2000); // 3. Reverts to "Save Strategy"
  } catch (e) { 
    setSaveStatus('error'); 
  }
}, [user, activeSlot, currentActiveConfig, strategyNames, globalEvents]);

const handleSlotChange = (newSlot) => { 
  if (activeSlot !== newSlot) { 
    // 1. Save current slider positions into the Master List for the OLD slot
    setAllCasesData(prev => ({
      ...prev, 
      [activeSlot]: { ...currentActiveConfig } 
    }));

    // 2. Change the active slot
    setActiveSlot(newSlot); 

    // 3. Force the sliders to jump to the values stored in the NEW slot
    // If the new slot is empty, use the default values
    const nextData = allCasesData[newSlot] || defaultConfig;
    applyConfigToState(nextData);
  } 
};
    
  const handleRevert = useCallback(() => {
    if (allCasesData[activeSlot]) applyConfigToState(allCasesData[activeSlot]); else applyConfigToState(defaultConfig);
    setGlobalEvents(savedGlobalEvents); setSaveStatus('idle');
  }, [allCasesData, activeSlot, applyConfigToState, savedGlobalEvents]);

  const resetTaxSettings = () => {
    setFilingStatus(defaultConfig.filingStatus);
    setCurrentState(defaultConfig.currentState);
    setDestinationState(defaultConfig.destinationState);
    setRelocationYear(defaultConfig.relocationYear);
    setInvestmentIncome(defaultConfig.investmentIncome);
    setCapitalGains(defaultConfig.capitalGains);
    setRothConversionStrategy(defaultConfig.rothConversionStrategy);
    setAnnualConversionAmount(defaultConfig.annualConversionAmount);
    setConversionStartYear(defaultConfig.conversionStartYear);
    setConversionDuration(defaultConfig.conversionDuration);
    setTargetMarginalBracket(defaultConfig.targetMarginalBracket);
  };

 const processExport = async (password) => {
    try {
      // 1. Sync the current screen into the master cases list
      const latestAllCases = { 
        ...allCasesData, 
        [activeSlot]: { ...currentActiveConfig } 
      };

      // 2. Build the data bundle using your actual state names
      const exportData = { 
        cases: latestAllCases, 
        events: globalEvents, 
        strategyNames: strategyNames,
        // Using the exact variables from your App.jsx state
        legacySettings: { desiredLegacy, numChildren, childConfigs },
        taxSettings: { filingStatus, currentState, destinationState, relocationYear },
        appVersion: "5.4"
      };

      // 3. Encrypt and Trigger Download
      const fileContent = await encryptData(exportData, password);
      const blob = new Blob([fileContent], { type: password ? 'text/plain' : 'application/json' });
      const url = URL.createObjectURL(blob); 
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `WealthPlan_v5.4_${new Date().getTime()}.${password ? 'enc' : 'json'}`; 
      
      document.body.appendChild(a); 
      a.click(); 
      document.body.removeChild(a);
      
      // 4. Close the modal
      setExportModal({ isOpen: false, tempKey: '' });
      setAllCasesData(latestAllCases);

    } catch(err) { 
      console.error("Export Error:", err);
      // This will tell you exactly why the button "froze"
      alert("Export failed. Check the console for details.");
    }
  };
  const processImport = async (content, password) => {
    try {
      const imported = await decryptData(content, password);
      if (imported.cases) {
        setAllCasesData(imported.cases);
        // Force the UI sliders to jump to the values in the imported file
        if (imported.cases[activeSlot]) {
            applyConfigToState(imported.cases[activeSlot]);
      } 
        if (imported.legacyConfig) setLegacyConfig(imported.legacyConfig);
        if (imported.taxConfig) setTaxConfig(imported.taxConfig);
        if (imported.strategyNames) setStrategyNames(imported.strategyNames);
        if (imported.events) setGlobalEvents(imported.events);
        if (user) {
           for (let i of [1, 2, 3]) { if (imported.cases[i]) { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'saved_strategies', i.toString()), { ...imported.cases[i], updatedAt: new Date().toISOString() }); } }
           if (imported.strategyNames) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'strategy_names'), imported.strategyNames);
           if (imported.events) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'metadata', 'global_events'), { events: imported.events });
        }
        applyConfigToState(imported.cases[activeSlot] || defaultConfig);
      }
      setImportModal({ isOpen: false, fileContent: null, error: '', tempKey: '' });
    } catch (err) { 
        if (content.startsWith("ENCRYPTED:")) {
           setImportModal(prev => ({ ...prev, error: 'Invalid password or corrupted file.' }));
        } else {
           console.error("Import failed.", err); 
        }
    }
  };

  const handleImportJSON = async (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
       const content = e.target.result;
       if (content.startsWith("ENCRYPTED:")) {
          setImportModal({ isOpen: true, fileContent: content, error: '', tempKey: '' });
       } else {
          processImport(content, null);
       }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  // --- Simulation Execution --- 
  const simulationResult = useMemo(() => {
    const activeEvents = globalEvents.filter(e => e.applicableSlots?.includes(activeSlot) ?? true);
    return runSimulationCore(currentActiveConfig, activeEvents, false);
  }, [currentActiveConfig, globalEvents, activeSlot]);

  const { data, annualTaxData, finalBalance, totalRmd, totalTax, irmaaYears, isBroke, perezPoint, downsizePoint, childGiftPoints, retirementPoint, customEventPoints, primarySsiPoint, spouseSsiPoint, totalSsiIncome, totalHomeTransactionNet, finalHomeVal } = simulationResult;

  // --- Bracket Capacity Calculator (First Year of Conversion) ---
  const bracketAnalysis = useMemo(() => {
    const startIdx = Math.max(0, conversionStartYear - BASE_YEAR);
    let wSalary = 0;
    if (isWorking) {
       if (startIdx < phase1Duration) wSalary += phase1Salary;
       else if (startIdx < phase1Duration + phase2Duration) wSalary += phase2Salary;
       if (hasSpouse && startIdx < spouseDuration) wSalary += spouseSalary;
    }
    const ssiBase = (hasSsi && (currentAge + startIdx) >= primarySsiAge) ? primarySsiAmount : 0;
    const spSsiBase = (hasSsi && hasSpouse && (spouseAge + startIdx) >= spouseSsiAge) 
      ? (useSpousalSsiRule ? (primarySsiAmount / 2) : spouseSsiAmount) 
      : 0;
    const baseIncome = wSalary + ssiBase + spSsiBase + investmentIncome + capitalGains;
    const stdDed = filingStatus === 'MFJ' ? 29200 : 14600;
    const baseTaxable = Math.max(0, baseIncome - stdDed);
    const top22 = filingStatus === 'MFJ' ? 201050 : 100525;
    const top24 = filingStatus === 'MFJ' ? 383900 : 191950;
    const irmaaBase = filingStatus === 'MFJ' ? 206000 : 103000;
    const capacity22 = Math.max(0, top22 - baseTaxable);
    const capacity24 = Math.max(0, top24 - baseTaxable);
    const capacityIRMAA = Math.max(0, irmaaBase - baseTaxable);
    return { baseTaxable, capacity22, capacity24, capacityIRMAA };
  }, [conversionStartYear, phase1Duration, phase1Salary, phase2Duration, phase2Salary, spouseDuration, spouseSalary, isWorking, currentAge, spouseAge, primarySsiAge, primarySsiAmount, spouseSsiAge, spouseSsiAmount, hasSsi, hasSpouse, filingStatus, investmentIncome, capitalGains]);

  // --- MC Loop ---
  // --- MC Loop (Worker Version) ---
  useEffect(() => {
    if (activePage !== 'monte-carlo') return;
    
    setIsCalculatingMC(true);

    // Initialize the background worker
    const worker = new Worker(new URL('./workers/simulation.worker.js', import.meta.url), { type: 'module' });

    // Send all the necessary data to the background thread
    worker.postMessage({
      config: currentActiveConfig,
      events: globalEvents,
      mcSettings: { mcVolatility, mcInflationStd },
      mcSimCount,
      activeSlot,
      allCasesData,
      defaultConfig
    });

    // Handle the finished data coming back
    worker.onmessage = (e) => {
      setMcData(e.data);
      setIsCalculatingMC(false);
      worker.terminate(); // Free up memory
    };

    return () => worker.terminate(); // Cleanup if user leaves the page
  }, [activePage, mcSimCount, mcVolatility, mcInflationStd, currentActiveConfig, allCasesData, activeSlot, globalEvents]);

  // --- Actionable AI Strategic Advisors ---
  const fetchAIInsights = async () => {
    setIsGeneratingInsight(true);
    const apiKey = "";
    const payload = [1, 2, 3].map(slot => {
      const config = slot === activeSlot ? currentActiveConfig : (allCasesData[slot] || defaultConfig);
      const mc = mcData?.[slot];
      const targetEvents = globalEvents.filter(e => e.applicableSlots?.includes(slot) ?? true);
      const det = runSimulationCore(config, targetEvents, false);
      return {
        caseName: strategyNames[slot], success: mc?.successProbability,
        legacyVariance: (det.finalBalance + det.finalHomeVal) - config.desiredLegacy,
        annualGoGoSpend: config.goGoSpend * 12, workforceDuration: config.phase1Duration
      };
    });

    const prompt = `Evaluate these scenarios: ${JSON.stringify(payload)}. ${userAiQuestion ? `\nUser Question: ${userAiQuestion}` : ""}`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                analysis: { type: "STRING", description: "Your written evaluation and reasoning." },
                applyChanges: { type: "BOOLEAN", description: "Set to true if recommending specific parameter tweaks for the active case." },
                goGoSpend: { type: "INTEGER" },
                phase1Duration: { type: "INTEGER" }
              },
              required: ["analysis", "applyChanges"]
            }
          }
        })
      });
      const resData = await res.json();
      setAiInsight(JSON.parse(resData.candidates?.[0]?.content?.parts?.[0]?.text));
    } catch (e) { setAiInsight({ analysis: "AI temporarily unavailable.", applyChanges: false }); }
    setIsGeneratingInsight(false);
  };

  const fetchTaxAIInsights = async () => {
    setIsGeneratingTaxInsight(true);
    const apiKey = "";
    
    const multiCasePayload = [1, 2, 3].map(slot => {
      const config = slot === activeSlot ? currentActiveConfig : (allCasesData[slot] || defaultConfig);
      const targetEvents = globalEvents.filter(e => e.applicableSlots?.includes(slot) ?? true);
      const det = runSimulationCore(config, targetEvents, false);
      return {
        caseName: strategyNames[slot],
        strategy: config.rothConversionStrategy,
        annualConversion: config.annualConversionAmount,
        targetBracket: config.targetMarginalBracket,
        totalLifetimeTaxes: det.totalTax,
        totalRmdLiability: det.totalRmd,
        irmaaTriggerYears: det.irmaaYears,
        finalEstateValue: det.finalBalance
      };
    });

    const activeContext = {
      baseTaxableIncomeCalculated: bracketAnalysis.baseTaxable,
      filingStatus: filingStatus,
      stateTaxJurisdiction: currentState,
      investmentIncome: investmentIncome,
      capitalGains: capitalGains
    };

    const prompt = `Act as an elite CPA and expert tax planner. Review these 3 tax planning scenarios my client is considering: ${JSON.stringify(multiCasePayload)}. 
    1. Speak to each case individually and compare their tax efficiencies, RMD liabilities, and IRMAA exposures.
    2. Focus your final recommendation on the currently active Case ${activeSlot} (${strategyNames[activeSlot]}). Given their filing status (${activeContext.filingStatus}) and base taxable income ($${activeContext.baseTaxableIncomeCalculated}), advise on the optimal tax brackets for Roth conversions. Warn about IRMAA cliffs if applicable.
    Provide actionable parameter changes (strategy, annualAmount, bracket, duration) to optimize Case ${activeSlot}.`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                analysis: { type: "STRING", description: "CPA rationale for the tax strategy." },
                applyChanges: { type: "BOOLEAN", description: "True if providing actionable parameter changes." },
                strategy: { type: "STRING", description: "none, annual, or bracket" },
                annualAmount: { type: "INTEGER" },
                bracket: { type: "INTEGER" },
                duration: { type: "INTEGER" }
              },
              required: ["analysis", "applyChanges"]
            }
          }
        })
      });
      const resData = await res.json();
      setTaxAiInsight(JSON.parse(resData.candidates?.[0]?.content?.parts?.[0]?.text));
    } catch (e) { setTaxAiInsight({ analysis: "AI Advisor temporarily unavailable.", applyChanges: false }); }
    setIsGeneratingTaxInsight(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 select-none">
      <div className="max-w-[1600px] mx-auto w-full">
        <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div><h1 className="text-2xl font-black text-slate-800">Wealth Planner v5.4</h1><p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Strategic Portfolio Modeler • Actionable AI</p></div>
            <nav className="flex bg-slate-200/50 p-1 rounded-xl gap-1 shadow-inner">
              <button onClick={() => setActivePage('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><LayoutDashboard size={14} className="inline mr-2"/> Model</button>
              <button onClick={() => setActivePage('events')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'events' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><ListTree size={14} className="inline mr-2"/> Life Events</button>
              <button onClick={() => setActivePage('monte-carlo')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'monte-carlo' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Binary size={14} className="inline mr-2"/> Monte Carlo</button>
              <button onClick={() => setActivePage('tax')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activePage === 'tax' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Landmark size={14} className="inline mr-2"/> Tax Planning</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
  {user ? (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
      <div className="text-right text-[10px] font-bold text-slate-500">{user.email || 'Private User'}</div>
      <button onClick={() => signOut(auth)} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={16}/></button>
    </div>
  ) : (
    <button onClick={async () => { const p = new GoogleAuthProvider(); await signInWithPopup(auth, p); }} className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">
      Connect Profile
    </button>
  )}
  {/* The Print button now sits outside the logic so it always appears */}
  <button 
    onClick={() => window.print()} 
    className="bg-slate-800 text-white px-5 py-2.5 rounded-xl border border-slate-700 shadow-sm font-bold text-sm hover:bg-slate-900 transition-all ml-3 flex items-center gap-2"
  >
    <Printer size={16}/> Print Report
  </button>
</div>
        </header>

        {activePage === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch animate-in fade-in duration-500">
            {/* Sidebar Controls */}
            <div className="lg:col-span-1 flex flex-col bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto max-h-[1100px] scrollbar-hide">
              <section className="space-y-4">
                <div className="flex gap-1 p-1 bg-slate-50 rounded-xl shadow-inner">
                  {[1, 2, 3].map(slot => (
                    <button key={slot} onClick={() => handleSlotChange(slot)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeSlot === slot ? 'bg-white shadow-sm text-blue-600 border border-blue-100' : 'text-slate-400 hover:text-slate-600'}`}>Case {slot}</button>
                  ))}
                </div>
                <div className="space-y-3">
                  <input type="text" value={strategyNames[activeSlot]} onChange={(e) => setStrategyNames(prev => ({...prev, [activeSlot]: e.target.value}))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none focus:ring-1 ring-blue-500" />
                  <button onClick={() => saveCurrentStrategy()} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-blue-700">
                    <Save size={16} /> {saveStatus === 'saving' ? 'Syncing...' : 'Save Strategy'}
                  </button>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button onClick={handleRevert} className="py-2 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600">Revert</button>
                    <button onClick={() => fileInputRef.current?.click()} className="py-2 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 border-l border-r border-slate-100">Import</button>
                    <button onClick={() => setExportModal({ isOpen: true, tempKey: '' })} className="py-2 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600">Export</button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleImportJSON} />
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-4 border-t border-slate-50 mt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b pb-2"><User size={14} /> Demographics</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-3">Primary Earner</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Age</label><StepperInput value={currentAge} onChange={setCurrentAge} /></div>
                      <div><label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">End Age</label><StepperInput value={lifeExpectancy} onChange={setLifeExpectancy} /></div>
                    </div>
                  </div>
                  {hasSpouse && (
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in">
                      <span className="text-[9px] font-black text-indigo-400 uppercase block mb-3">Spouse</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-indigo-400 mb-1 uppercase">Age</label><StepperInput value={spouseAge} onChange={setSpouseAge} /></div>
                        <div><label className="block text-[10px] font-bold text-indigo-400 mb-1 uppercase">End Age</label><StepperInput value={spouseLifeExpectancy} onChange={setSpouseLifeExpectancy} /></div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4 pt-4 border-t border-slate-50 mt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b pb-2"><PieChart size={14} /> Assets</h3>
                <div className="space-y-4">
                  <div><label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-slate-500"><span>Brokerage</span><span className="text-blue-600 font-black">{formatUSD(portfolioValue)}</span></label><input type="range" min="0" max="5000000" step="50000" value={portfolioValue} onChange={e=>setPortfolioValue(parseInt(e.target.value))} className="w-full h-1 bg-slate-100 rounded accent-blue-600" /></div>
                  <div><label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-slate-500"><span>Roth</span><span className="text-purple-600 font-black">{formatUSD(rothBalance)}</span></label><input type="range" min="0" max="3000000" step="50000" value={rothBalance} onChange={e=>setRothBalance(parseInt(e.target.value))} className="w-full h-1 bg-slate-100 rounded accent-purple-600" /></div>
                  <div><label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-slate-500"><span>IRA / 401k</span><span className="text-indigo-600 font-black">{formatUSD(iraBalance)}</span></label><input type="range" min="0" max="5000000" step="50000" value={iraBalance} onChange={e=>setIraBalance(parseInt(e.target.value))} className="w-full h-1 bg-slate-100 rounded accent-indigo-600" /></div>
                  <div className="pt-2"><label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-emerald-600"><span>Growth Rate</span><span className="font-bold">{growthRate}%</span></label><input type="range" min="-2" max="15" step="0.5" value={growthRate} onChange={e=>setGrowthRate(parseFloat(e.target.value))} className="w-full h-1 bg-slate-100 rounded accent-emerald-500" /></div>
                </div>
              </section>

              <section className="space-y-4 pt-4 border-t border-slate-50 mt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b pb-2"><Home size={14} /> Housing & Real Estate</h3>
                <div className="space-y-4">
                  <div><label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-slate-500"><span>Primary Home</span><span className="text-teal-600 font-black">{formatUSD(homeValue)}</span></label><input type="range" min="0" max="5000000" step="50000" value={homeValue} onChange={e=>setHomeValue(parseInt(e.target.value))} className="w-full h-1 bg-slate-100 rounded accent-teal-600" /></div>
                  <label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-teal-600"><span>Appreciation</span><span className="font-bold">{homeAppreciation}%</span></label><input type="range" min="-2" max="15" step="0.5" value={homeAppreciation} onChange={e=>setHomeAppreciation(parseFloat(e.target.value))} className="w-full h-1 bg-slate-100 rounded accent-teal-500" />

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Home Changes & Relocation</span>
                      <button onClick={()=>setIsDownsizing(!isDownsizing)} className={`w-8 h-4 rounded-full relative transition-colors ${isDownsizing ? 'bg-teal-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDownsizing ? 'left-4.5' : 'left-0.5'}`} /></button>
                    </div>
                    {isDownsizing && (
                      <div className="space-y-3 p-3 bg-teal-50/50 rounded-xl border border-teal-100 animate-in fade-in">
                        <div><label className="block text-[8px] font-bold text-teal-600 mb-1">TARGET MOVE YEAR</label><StepperInput value={relocationYear} onChange={(val) => { setRelocationYear(val); setDownsizeCalendarYear(val); }} /></div>
                        <div><label className="block text-[8px] font-bold text-teal-600 mb-1">NEW HOME VALUE</label><CurrencyInput value={replacementHomeValue} onChange={setReplacementHomeValue} /></div>
                        <div className="flex justify-between items-center"><span className="text-[8px] font-bold text-teal-600 uppercase">SALE FRICTION %</span><span className="text-[10px] font-bold text-teal-700">{homeSaleFee}%</span><input type="range" min="0" max="15" value={homeSaleFee} onChange={e=>setHomeSaleFee(parseInt(e.target.value))} className="w-16 h-1 bg-white accent-teal-500" /></div>
                        
                        <div className="pt-3 mt-3 border-t border-teal-200/50">
                          <label className="block text-[8px] font-bold text-blue-600 uppercase mb-2">Tax Jurisdiction Change</label>
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-600">
                            <select value={currentState} onChange={e=>setCurrentState(e.target.value)} className="bg-white px-2 py-1 rounded border border-teal-200 text-blue-600 outline-none">
                               {Object.keys(STATE_TAX_RATES).map(s => <option key={`src-${s}`} value={s}>{s} ({STATE_TAX_RATES[s]}%)</option>)}
                            </select>
                            <ChevronDown size={12} className="-rotate-90 text-slate-400"/>
                            <select value={destinationState} onChange={e=>setDestinationState(e.target.value)} className="bg-white px-2 py-1 rounded border border-teal-200 text-blue-600 outline-none">
                               {Object.keys(STATE_TAX_RATES).map(s => <option key={`dst-${s}`} value={s}>{s} ({STATE_TAX_RATES[s]}%)</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-4 border-t border-slate-50 mt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b pb-2"><ShieldAlert size={14} className="text-amber-500"/> Tech Disruption</h3>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3">
                   <div><label className="block text-[8px] font-bold text-amber-600 mb-1">IMPACT YEAR</label><StepperInput value={perezCalendarYear} onChange={setPerezCalendarYear} /></div>
                   <div>
                      <label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-amber-700"><span>Asset Drawdown</span><span className="font-black">{perezIntensity}%</span></label>
                      <input type="range" min="0" max="60" step="5" value={perezIntensity} onChange={e=>setPerezIntensity(parseInt(e.target.value))} className="w-full h-1 bg-white rounded accent-amber-500" />
                   </div>
                </div>
              </section>
            </div>

            {/* Strategic Details Sidebar */}
            <div className="lg:col-span-1 flex flex-col bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto max-h-[1100px] scrollbar-hide">
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2 font-black"><Heart size={14} className="text-rose-500" /> Legacy Strategy</h3>
                <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50">
                   <label className="block text-[10px] font-black text-rose-800 uppercase mb-2">Target Nominal Legacy</label>
                   <CurrencyInput value={desiredLegacy} onChange={setDesiredLegacy} className="bg-white border-rose-200 ring-rose-500" />
                </div>
                <div className="space-y-3">{childConfigs.slice(0, numChildren).map((child) => (
                  <div key={child.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-sm transition-all hover:bg-slate-100/50">
                    <div className="flex justify-between items-center"><input type="text" value={child.name} onChange={e=> { setChildConfigs(prev=>prev.map(c=>c.id===child.id?{...c, name: e.target.value}:c))}} className="text-[10px] font-black text-slate-600 uppercase bg-transparent border-none outline-none w-32" /><Users size={12} className="text-slate-300" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><label className="text-[8px] font-bold text-slate-400 uppercase mb-1">Monthly Support</label><CurrencyInput value={child.monthly} onChange={v=> { setChildConfigs(prev=>prev.map(c=>c.id===child.id?{...c, monthly: v}:c))}} /></div>
                      <div><label className="text-[8px] font-bold text-slate-400 uppercase mb-1">Start Yr</label><StepperInput value={child.supportStartYear} onChange={v=> { setChildConfigs(prev=>prev.map(c=>c.id===child.id?{...c, supportStartYear: v}:c))}} /></div>
                      <div><label className="text-[8px] font-bold text-slate-400 uppercase mb-1">Duration</label><StepperInput value={child.supportDuration} onChange={v=> { setChildConfigs(prev=>prev.map(c=>c.id===child.id?{...c, supportDuration: v}:c))}} /></div>
                      <div className="col-span-2 pt-2 border-t border-slate-100 flex gap-2">
                        <NumericInput value={child.grantCalendarYear} onChange={v=> { setChildConfigs(prev=>prev.map(c=>c.id===child.id?{...c, grantCalendarYear: v}:c))}} className="w-1/2 text-center" placeholder="Gift Year" />
                        <CurrencyInput value={child.giftAmount} onChange={v=> { setChildConfigs(prev=>prev.map(c=>c.id===child.id?{...c, giftAmount: v}:c))}} className="w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}</div>
                <div><label className="flex justify-between text-[11px] font-bold uppercase text-rose-700"><span>Number of Children</span><span className="font-bold">{numChildren}</span></label><input type="range" min="0" max="5" value={numChildren} onChange={e=>setNumChildren(parseInt(e.target.value))} className="w-full h-1.5 bg-rose-50 rounded accent-rose-500 shadow-inner" /></div>
              </section>

              <section className="space-y-4 pt-4 border-t border-slate-100 mt-4">
                <div className="flex justify-between items-center"><h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-2 font-black"><Landmark size={14} /> Social Security</h3><button onClick={()=>setHasSsi(!hasSsi)} className={`w-8 h-4 rounded-full relative transition-colors ${hasSsi ? 'bg-sky-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${hasSsi ? 'left-4.5' : 'left-0.5'}`} /></button></div>
                {hasSsi && (
  <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-4">
    <span className="text-[10px] font-black text-sky-800 uppercase block tracking-wider">Primary Earner</span>
    <div className="grid grid-cols-2 gap-3">
      <div><label className="block text-[8px] font-bold text-sky-600 mb-1 uppercase">Claim Age</label><StepperInput value={primarySsiAge} onChange={setPrimarySsiAge} /></div>
      <div><label className="block text-[8px] font-bold text-sky-600 mb-1 uppercase">Annual</label><CurrencyInput value={primarySsiAmount} onChange={setPrimarySsiAmount} /></div>
    </div>
    
    {hasSpouse && (
      <div className="pt-2 border-t border-sky-100 animate-in fade-in">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-sky-800 uppercase block tracking-wider">Spouse</span>
          {/* THE NEW 50% RULE TOGGLE */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={useSpousalSsiRule} 
              onChange={(e) => setUseSpousalSsiRule(e.target.checked)}
              className="w-3 h-3 rounded border-sky-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <span className="text-[9px] font-bold text-sky-600 uppercase group-hover:text-sky-800 transition-colors">50% of Primary</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[8px] font-bold text-sky-600 mb-1 uppercase">Claim Age</label><StepperInput value={spouseSsiAge} onChange={setSpouseSsiAge} /></div>
          <div>
            <label className="block text-[8px] font-bold text-sky-600 mb-1 uppercase">Annual</label>
            <CurrencyInput 
              value={useSpousalSsiRule ? primarySsiAmount / 2 : spouseSsiAmount} 
              onChange={setSpouseSsiAmount} 
              disabled={useSpousalSsiRule} 
            />
          </div>
        </div>
      </div>
    )}
  </div>
)}
              </section>

              <section className="space-y-4 pt-4 border-t border-slate-100 mt-auto">
                <div className="flex justify-between items-center"><h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2 font-black"><Briefcase size={14} /> Workforce</h3><button onClick={()=>setIsWorking(!isWorking)} className={`w-8 h-4 rounded-full relative transition-colors ${isWorking ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isWorking ? 'left-4.5' : 'left-0.5'}`} /></button></div>
                {isWorking && (
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                    <span className="text-[10px] font-black text-blue-800 uppercase block tracking-wider">Primary Career (Phase 1)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-[8px] font-bold text-blue-600 mb-1 uppercase">Annual</label><CurrencyInput value={phase1Salary} onChange={setPhase1Salary} /></div>
                      <div><label className="block text-[8px] font-bold text-blue-600 mb-1 uppercase">Duration</label><StepperInput value={phase1Duration} onChange={setPhase1Duration} /></div>
                    </div>
                    <span className="text-[10px] font-black text-blue-800 uppercase block tracking-wider pt-2 border-t border-blue-100">Consulting (Phase 2)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-[8px] font-bold text-blue-600 mb-1 uppercase">Annual</label><CurrencyInput value={phase2Salary} onChange={setPhase2Salary} /></div>
                      <div><label className="block text-[8px] font-bold text-blue-600 mb-1 uppercase">Duration</label><StepperInput value={phase2Duration} onChange={setPhase2Duration} /></div>
                    </div>
                    {hasSpouse && (
                      <div className="pt-2 border-t border-blue-100 animate-in fade-in">
                        <span className="text-[10px] font-black text-indigo-800 uppercase block tracking-wider mb-3">Spouse Career</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-[8px] font-bold text-indigo-600 mb-1 uppercase">Annual</label><CurrencyInput value={spouseSalary} onChange={setSpouseSalary} /></div>
                          <div><label className="block text-[8px] font-bold text-indigo-600 mb-1 uppercase">Duration</label><StepperInput value={spouseDuration} onChange={setSpouseDuration} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Visualization Workspace */}
            <div className="lg:col-span-3 flex flex-col space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm min-h-[180px]">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest"><Zap size={18} /> Go-Go Spend</div>
                  <div className="my-3"><CurrencyInput value={goGoSpend} onChange={setGoGoSpend} /></div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-3"><span>Duration</span><span>{goGoDuration} Yrs</span></div>
                  <input type="range" min="1" max={25} value={goGoDuration} onChange={e=>setGoGoDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-indigo-50 accent-indigo-600 mt-2" />
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm min-h-[180px]">
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest"><Coffee size={18} /> Slow-Go Spend</div>
                  <div className="my-3"><CurrencyInput value={slowGoSpend} onChange={setSlowGoSpend} /></div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mt-3"><span>Duration</span><span>{slowGoDuration} Yrs</span></div>
                  <input type="range" min="1" max={25} value={slowGoDuration} onChange={e=>setSlowGoDuration(parseInt(e.target.value))} className="w-full h-1.5 bg-emerald-50 accent-emerald-600 mt-2" />
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm min-h-[180px]">
                  <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1"><Moon size={18} /> No-Go Spend</div>
                  <div className="my-3"><CurrencyInput value={noGoSpend} onChange={setNoGoSpend} /></div>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-3 tracking-tighter">Applied Age 75+</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex-grow relative">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-slate-700 text-xl uppercase tracking-tight">Financial Horizon</h3>
                  <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2 text-blue-600"><div className="w-3 h-3 bg-blue-500 rounded-full" />Total Portfolio</div>
                    <div className="flex items-center gap-2 text-slate-400"><div className="w-3 h-3 bg-slate-300 rounded-full" />Home Equity</div>
                    <div className="flex items-center gap-2 text-rose-500"><div className="w-3 h-3 bg-rose-400 rounded-full" />Withdrawal %</div>
                  </div>
                </div>
                <div className="h-[520px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 35 }}>
                      <defs><linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={isBroke ? "#ef4444" : "#3b82f6"} stopOpacity={0.25}/><stop offset="95%" stopColor={isBroke ? "#ef4444" : "#3b82f6"} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} stroke="#94a3b8" fontSize={11} tick={<CustomizedAxisTick baseYear={BASE_YEAR} currentAge={currentAge} />} height={70} interval={3} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickFormatter={v=>`$${(v/1000000).toFixed(1)}M`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#f87171" fontSize={11} tickFormatter={v=>`${v}%`} />
                      <Tooltip formatter={v=>formatUSD(v)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }} />
                      <Area yAxisId="left" type="monotone" dataKey="projectedHome" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="8 4" fill="transparent" />
                      <Area yAxisId="left" type="monotone" dataKey="balance" stroke={isBroke ? "#ef4444" : "#3b82f6"} strokeWidth={4} fill="url(#colorBal)" />
                      <Line yAxisId="right" type="monotone" dataKey="withdrawalRate" stroke="#f87171" strokeWidth={3} dot={false} strokeDasharray="4 2" />
                      {primarySsiPoint && <ReferenceDot yAxisId="left" x={primarySsiPoint.age} y={primarySsiPoint.balance} shape={(p) => <SsiMarker {...p} fill="#0284c7" />} />}
                      {spouseSsiPoint && <ReferenceDot yAxisId="left" x={spouseSsiPoint.age} y={spouseSsiPoint.balance} shape={(p) => <SsiMarker {...p} fill="#6366f1" />} />}
                      {perezPoint && <ReferenceDot yAxisId="left" x={perezPoint.age} y={perezPoint.balance} r={6} fill="#d97706" stroke="#fff" strokeWidth={2} />}
                      {downsizePoint && <ReferenceDot yAxisId="left" x={downsizePoint.age} y={downsizePoint.balance} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />}
                      {childGiftPoints?.map((pt, i) => <ReferenceDot key={`gift-${i}`} yAxisId="left" x={pt.age} y={pt.balance} r={5} fill="#f43f5e" stroke="#fff" strokeWidth={2} />)}
                      {customEventPoints?.map((pt, i) => <ReferenceDot key={`custom-${i}`} yAxisId="left" x={pt.age} y={pt.balance} r={4} fill={pt.type==='income'?'#10b981':'#8b5cf6'} stroke="#fff" strokeWidth={1} />)}
                      {retirementPoint && <ReferenceDot yAxisId="left" x={retirementPoint.age} y={retirementPoint.balance} shape={(p) => <StarMarker {...p} />} />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col justify-between min-h-[180px]">
                  <h4 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase mb-4 tracking-widest"><DollarSign size={14} className="text-blue-400" /> Estate End State</h4>
                  <div className="space-y-3 text-sm font-black">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-2"><span className="text-[10px] text-slate-400 uppercase">Liquid Portfolio</span><span className={isBroke ? 'text-red-400' : 'text-blue-400'}>{formatUSD(finalBalance)}</span></div>
                    <div className="flex justify-between items-end border-b border-slate-800 pb-2"><span className="text-[10px] text-slate-400 uppercase">Target Legacy</span><span className="text-amber-400">{formatUSD(desiredLegacy)}</span></div>
                    <div className="flex justify-between items-end pt-2 border-t border-slate-800"><span className="text-[10px] text-blue-400 uppercase">Legacy Variance</span><span className={(finalBalance + finalHomeVal - desiredLegacy) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatUSD(finalBalance + finalHomeVal - desiredLegacy)}</span></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[180px]">
                  <h4 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase mb-4 tracking-widest"><Wallet size={14} className="text-emerald-500" /> Efficiency Analysis</h4>
                  <div className="space-y-3 text-sm font-black">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-2"><span className="text-[10px] text-slate-500 uppercase">Lifetime SSI Offset</span><span className="text-sky-600">{formatUSD(totalSsiIncome)}</span></div>
                    <div className="flex justify-between items-end border-b border-slate-100 pb-2"><span className="text-[10px] text-slate-500 uppercase">Net Home Liquidity</span><span className="text-emerald-600">{formatUSD(totalHomeTransactionNet)}</span></div>
                    <div className="flex justify-between items-center pt-2"><span className="text-[10px] text-slate-400 uppercase">Horizon Viability</span><span className={`text-[10px] uppercase px-4 py-1.5 rounded-lg font-black ${isBroke ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{isBroke ? 'Deficit' : 'Success'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePage === 'events' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-8 border-b pb-6"><div><h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><CreditCard className="text-rose-500" /> Capital Draws & Expenses</h2><p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Major purchases, recurring costs, education</p></div><button onClick={()=>setGlobalEvents(prev=>[...prev, { id: crypto.randomUUID(), type: 'expense', label: 'New Item', amount: 10000, year: BASE_YEAR + 5, applicableSlots: [1,2,3], isRecurring: false, recurringFrequency: 1, recurringEndYear: BASE_YEAR+15 }])} className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-md hover:bg-rose-700 transition-all"><Plus size={16}/> Add Expense</button></div>
                <div className="space-y-4">{globalEvents.filter(e=>e.type==='expense').length===0 ? <div className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest border-2 border-dashed rounded-3xl border-slate-100">No custom expenses added.</div> : globalEvents.filter(e=>e.type==='expense').map(e=><EventRow key={e.id} event={e} onUpdate={(id, f, v)=> setGlobalEvents(prev=>prev.map(item=>item.id===id?{...item, [f]:v}:item))} onRemove={(id)=>setGlobalEvents(prev=>prev.filter(item=>item.id!==id))} />)}</div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-8 border-b pb-6"><div><h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Banknote className="text-emerald-500" /> Supplemental Liquidity</h2><p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Inheritances, rental income, sale of assets</p></div><button onClick={()=>setGlobalEvents(prev=>[...prev, { id: crypto.randomUUID(), type: 'income', label: 'New Item', amount: 10000, year: BASE_YEAR + 5, applicableSlots: [1,2,3], isRecurring: false, recurringFrequency: 1, recurringEndYear: BASE_YEAR+15 }])} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-md hover:bg-emerald-700 transition-all"><Plus size={16}/> Add Income</button></div>
                <div className="space-y-4">{globalEvents.filter(e=>e.type==='income').length===0 ? <div className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest border-2 border-dashed rounded-3xl border-slate-100">No supplemental income added.</div> : globalEvents.filter(e=>e.type==='income').map(e=><EventRow key={e.id} event={e} onUpdate={(id, f, v)=> setGlobalEvents(prev=>prev.map(item=>item.id===id?{...item, [f]:v}:item))} onRemove={(id)=>setGlobalEvents(prev=>prev.filter(item=>item.id!==id))} />)}</div>
              </div>
            </div>
          </div>
        )}

        {activePage === 'monte-carlo' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch animate-in fade-in duration-500">
             <div className="lg:col-span-1 flex flex-col bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2"><Binary size={14} /> Global Engine</h3>
                  <div><label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-slate-500"><span>Sample Paths</span><span className="font-bold text-blue-600">{mcSimCount}</span></label><input type="range" min="100" max="5000" step="100" value={mcSimCount} onChange={e=>setMcSimCount(parseInt(e.target.value))} className="w-full h-1 bg-slate-100 rounded accent-blue-600" /></div>
                </section>
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2"><Activity size={14} /> Market Risk</h3>
                  <div className="space-y-6">
                    <div><label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-indigo-600"><span>Volatility</span><span className="font-bold">{mcVolatility}%</span></label><input type="range" min="2" max="30" step="0.5" value={mcVolatility} onChange={e=>setMcVolatility(parseFloat(e.target.value))} className="w-full h-1.5 bg-indigo-50 rounded accent-indigo-500 shadow-inner" /></div>
                    <div><label className="flex justify-between text-[11px] font-bold mb-1 uppercase text-amber-600"><span>Inflation SD</span><span className="font-bold">{mcInflationStd}%</span></label><input type="range" min="0.1" max="5" step="0.1" value={mcInflationStd} onChange={e=>setMcInflationStd(parseFloat(e.target.value))} className="w-full h-1.5 bg-amber-50 rounded accent-amber-500 shadow-inner" /></div>
                  </div>
                </section>
             </div>
             
             <div className="lg:col-span-4 flex flex-col space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                  {isCalculatingMC && <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}
                  {[1, 2, 3].map(slot => (
                    <div key={slot} className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-center items-center transition-all ${slot === activeSlot ? 'border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/10' : 'border-slate-200 bg-white'}`}>
                      <span className={`text-[10px] font-black uppercase mb-2 ${slot === activeSlot ? 'text-blue-600' : 'text-slate-400'}`}>{strategyNames[slot]} {slot === activeSlot && '(Active)'}</span>
                      <span className={`text-4xl font-black ${mcData?.[slot]?.successProbability > 80 ? 'text-emerald-500' : mcData?.[slot]?.successProbability > 50 ? 'text-amber-500' : 'text-rose-500'}`}>{mcData?.[slot] ? `${mcData[slot].successProbability.toFixed(1)}%` : '--%'}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase mt-2">Success Probability</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                   {isCalculatingMC && <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm z-10 rounded-3xl" />}
                   {[1, 2, 3].map(slot => {
                     const d = mcData?.[slot];
                     return (
                       <div key={`fan-${slot}`} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[280px]">
                          <h4 className="font-black text-slate-600 text-[10px] uppercase tracking-widest text-center mb-4">{strategyNames[slot]} Paths</h4>
                          <div className="flex-grow w-full">
                            {d && d.percentilesData && (
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={d.percentilesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} stroke="#94a3b8" fontSize={9} interval={4} />
                                  <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                                  <Area type="monotone" dataKey="p90" stroke="transparent" fill="#10b981" fillOpacity={0.05} />
                                  <Area type="monotone" dataKey="p10" stroke="transparent" fill="#ef4444" fillOpacity={0.05} />
                                  <Line type="monotone" dataKey="median" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                  <Line type="monotone" dataKey="p90" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                                  <Line type="monotone" dataKey="p10" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                                </ComposedChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                       </div>
                     );
                   })}
                </div>

                {mcData && (
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    {isCalculatingMC && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10" />}
                    <h3 className="font-black text-slate-700 text-xl uppercase flex items-center gap-2 mb-8 border-b pb-4"><TableProperties size={20} className="text-blue-600"/> Comparative Metrics</h3>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left text-sm mb-12">
                          <thead>
                             <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                                <th className="p-3">Metric</th>
                                {[1, 2, 3].map(slot => (
                                   <th key={slot} className="p-3 text-slate-700">{strategyNames[slot]} {activeSlot === slot && <span className="text-blue-500 ml-1">(Active)</span>}</th>
                                ))}
                             </tr>
                          </thead>
                          <tbody className="font-bold">
                             <tr className="border-b border-slate-100">
                                <td className="p-3 text-slate-500 uppercase text-[10px]">Success Prob.</td>
                                {[1, 2, 3].map(slot => (
                                   <td key={slot} className={`p-3 ${mcData[slot]?.successProbability > 80 ? 'text-emerald-600' : 'text-rose-600'}`}>{mcData[slot]?.successProbability.toFixed(1)}%</td>
                                ))}
                             </tr>
                             <tr className="border-b border-slate-100">
                                <td className="p-3 text-slate-500 uppercase text-[10px]">Median Ending Balance</td>
                                {[1, 2, 3].map(slot => (
                                   <td key={slot} className="p-3 text-slate-700">{formatUSD(mcData[slot]?.percentilesData?.[mcData[slot].percentilesData.length - 1]?.median || 0)}</td>
                                ))}
                             </tr>
                          </tbody>
                       </table>
                    </div>

                    <div className="space-y-8 pt-8 border-t border-slate-100">
                       <div className="flex flex-col gap-3">
                          <h4 className="font-black text-slate-700 text-lg uppercase flex items-center gap-2"><Sparkles size={18} className="text-amber-500"/> Actionable AI Strategic Advisor</h4>
                          <textarea value={userAiQuestion} onChange={e=>setUserAiQuestion(e.target.value)} placeholder="Ask specific questions (e.g., 'What happens if I work until age 70?')" className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-amber-400 min-h-[80px] shadow-sm resize-none" />
                          <div className="flex justify-end"><button onClick={fetchAIInsights} disabled={isGeneratingInsight} className="flex items-center gap-2 bg-amber-100 text-amber-700 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-amber-200 transition-all shadow-sm">{isGeneratingInsight ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} Generate Advice</button></div>
                       </div>
                       {aiInsight && (
                         <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-sm text-slate-700 leading-relaxed space-y-4 animate-in fade-in">
                           {aiInsight.analysis.split('\n').map((p, idx) => p.trim() ? <p key={idx}>{p.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-black text-slate-800">{part}</strong> : part)}</p> : null)}
                           {aiInsight.applyChanges && (
                              <div className="pt-4 border-t border-amber-200">
                                 <button onClick={() => {
                                    if (aiInsight.goGoSpend !== undefined) setGoGoSpend(aiInsight.goGoSpend);
                                    if (aiInsight.phase1Duration !== undefined) setPhase1Duration(aiInsight.phase1Duration);
                                    setAiInsight(null);
                                 }} className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-amber-600 transition-all">
                                    Apply AI Adjustments
                                 </button>
                              </div>
                           )}
                         </div>
                       )}
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {activePage === 'tax' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-in fade-in duration-500">
             {/* Configuration Panel */}
             <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6 flex flex-col max-h-[1100px] overflow-y-auto">
                <div className="flex gap-1 p-1 bg-slate-50 rounded-xl shadow-inner mb-2">
                  {[1, 2, 3].map(slot => (
                    <button key={slot} onClick={() => handleSlotChange(slot)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeSlot === slot ? 'bg-white shadow-sm text-blue-600 border border-blue-100' : 'text-slate-400 hover:text-slate-600'}`}>Case {slot}</button>
                  ))}
                </div>

                <button onClick={() => saveCurrentStrategy()} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-all">
                   <Save size={16} /> {saveStatus === 'saving' ? 'Syncing...' : 'Save Strategy'}
                </button>

                <section className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Scale size={14} /> Tax Compliance</h3>
                  <div><label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Filing Status</label><select value={filingStatus} onChange={e=>setFilingStatus(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none"><option value="Single">Single</option><option value="MFJ">Married Filing Jointly</option></select></div>
                </section>

                <section className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Banknote size={14} /> Other Income</h3>
                  <div className="space-y-3">
                     <div><label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Investment Income</label><CurrencyInput value={investmentIncome} onChange={setInvestmentIncome} /></div>
                     <div><label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Capital Gains</label><CurrencyInput value={capitalGains} onChange={setCapitalGains} /></div>
                  </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} /> Roth Strategy</h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Conversion Goal</label>
                    <select value={rothConversionStrategy} onChange={e=>setRothConversionStrategy(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black outline-none">
                       <option value="none">No Conversions</option>
                       <option value="annual">Fixed Annual Amount</option>
                       <option value="bracket">Fill Marginal Bracket</option>
                    </select>
                  </div>
                  
                  {rothConversionStrategy === 'bracket' && (
                     <div className="space-y-4 animate-in slide-in-from-top-2">
                         <div>
                           <label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase">Target Bracket Ceiling</label>
                           <select value={targetMarginalBracket} onChange={e=>setTargetMarginalBracket(parseInt(e.target.value))} className="w-full p-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-sm font-black outline-none">
                              <option value={22}>Top of 22% Bracket</option>
                              <option value={24}>Top of 24% Bracket</option>
                           </select>
                         </div>
                         <div><label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase">Start Year</label><NumericInput value={conversionStartYear} onChange={setConversionStartYear} /></div>
                         <div><label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase">Duration (Yrs)</label><StepperInput value={conversionDuration} onChange={setConversionDuration} /></div>
                     </div>
                  )}

                  {rothConversionStrategy === 'annual' && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                       <div>
                          <label className="flex justify-between text-[10px] font-black text-indigo-400 mb-2 uppercase">
                            <span>Annual Amount</span>
                            <span>{formatUSD(annualConversionAmount)}</span>
                          </label>
                          <input type="range" min="0" max="400000" step="5000" value={annualConversionAmount} onChange={e=>setAnnualConversionAmount(parseInt(e.target.value))} className="w-full h-1.5 bg-indigo-100 rounded accent-indigo-500 shadow-inner mb-3" />
                          <CurrencyInput value={annualConversionAmount} onChange={setAnnualConversionAmount} />
                       </div>
                       <div><label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase">Start Year</label><NumericInput value={conversionStartYear} onChange={setConversionStartYear} /></div>
                       <div><label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase">Duration (Yrs)</label><StepperInput value={conversionDuration} onChange={setConversionDuration} /></div>
                    </div>
                  )}
                </section>
                
                <div className="mt-auto pt-6">
                  <button onClick={resetTaxSettings} className="w-full py-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                     <RefreshCw size={14} /> Reset Tax Config
                  </button>
                </div>
             </div>

             {/* Analysis Workspace */}
             <div className="lg:col-span-4 flex flex-col space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center"><span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Total Lifetime Taxes</span><div className="text-2xl font-black text-slate-800">{formatUSD(totalTax)}</div></div>
                   <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center"><span className="text-[10px] font-black text-slate-400 uppercase block mb-1">RMD Liability</span><div className="text-2xl font-black text-indigo-600">{formatUSD(totalRmd)}</div></div>
                   <div className={`p-6 rounded-3xl shadow-sm border text-center ${irmaaYears > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}><span className="text-[10px] font-black text-slate-400 uppercase block mb-1">IRMAA Surcharge Years</span><div className={`text-2xl font-black ${irmaaYears > 0 ? 'text-amber-600' : 'text-emerald-500'}`}>{irmaaYears}</div></div>
                   <div className="bg-slate-900 p-6 rounded-3xl shadow-sm text-center text-white"><span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Tax Efficiency</span><div className="text-2xl font-black text-emerald-400">{((finalBalance / (iraBalance + rothBalance + portfolioValue)) * 100).toFixed(0)}%</div></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Account Mix Chart */}
                  <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex-grow">
                     <div className="flex justify-between items-center mb-8 border-b pb-4">
                        <h3 className="font-black text-slate-700 text-xl uppercase flex items-center gap-2 tracking-tight"><MapPin size={20} className="text-indigo-500"/> Account Mix & Relocation</h3>
                        <div className="flex gap-4 text-[9px] font-black uppercase text-slate-500"><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"/> Pre-Tax IRA</div><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-purple-500 rounded-sm"/> Roth IRA</div><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"/> Brokerage</div></div>
                     </div>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.filter((_,i) => i % 4 === 0)} margin={{ bottom: 35 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} stroke="#94a3b8" fontSize={11} tick={<CustomizedAxisTick baseYear={BASE_YEAR} currentAge={currentAge} />} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v=>`$${(v/1000000).toFixed(1)}M`} />
                            <Tooltip formatter={v=>formatUSD(v)} cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border:'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="ira" stackId="a" fill="#6366f1" />
                            <Bar dataKey="roth" stackId="a" fill="#a855f7" />
                            <Bar dataKey="brokerage" stackId="a" fill="#3b82f6" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 font-medium">
                        <strong>Tax Logic Rules:</strong> Conversions map ordinary income from your Pre-Tax IRA directly into the Roth IRA. To maximize the tax-free shield, the federal/state tax liability generated by this conversion is paid entirely out of your taxable Brokerage account.
                     </div>
                  </div>

                  {/* Marginal Bracket Optimizer */}
                  <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
                     <div>
                       <h3 className="font-black text-slate-700 text-lg uppercase flex items-center gap-2 border-b pb-3 tracking-tight"><Target size={18} className="text-emerald-500"/> Bracket Optimizer</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 mb-6">Year 1 ({conversionStartYear}) Capacity</p>
                       
                       <div className="space-y-5">
                         <div>
                            <div className="flex justify-between items-end mb-1"><span className="text-xs font-black text-slate-600 uppercase">Base Taxable</span><span className="text-sm font-black text-slate-800">{formatUSD(bracketAnalysis.baseTaxable)}</span></div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Pre-conversion (Wages + Inv + SSI - Std Ded)</div>
                         </div>
                         
                         <div className="pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-end mb-1"><span className="text-xs font-black text-emerald-600 uppercase">Room to max 22%</span><span className="text-sm font-black text-emerald-700">{formatUSD(bracketAnalysis.capacity22)}</span></div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1"><div className="bg-emerald-400 h-full" style={{ width: `${Math.min(100, (annualConversionAmount / (bracketAnalysis.capacity22 || 1)) * 100)}%` }}/></div>
                         </div>
                         
                         <div>
                            <div className="flex justify-between items-end mb-1"><span className="text-xs font-black text-blue-600 uppercase">Room to max 24%</span><span className="text-sm font-black text-blue-700">{formatUSD(bracketAnalysis.capacity24)}</span></div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1"><div className="bg-blue-400 h-full" style={{ width: `${Math.min(100, (annualConversionAmount / (bracketAnalysis.capacity24 || 1)) * 100)}%` }}/></div>
                         </div>

                         <div>
                            <div className="flex justify-between items-end mb-1"><span className="text-xs font-black text-rose-600 uppercase">IRMAA Buffer</span><span className="text-sm font-black text-rose-700">{formatUSD(bracketAnalysis.capacityIRMAA)}</span></div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1"><div className="bg-rose-400 h-full" style={{ width: `${Math.min(100, (annualConversionAmount / (bracketAnalysis.capacityIRMAA || 1)) * 100)}%` }}/></div>
                         </div>
                       </div>
                     </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex-grow mt-2">
                   <div className="flex justify-between items-center mb-8 border-b pb-4">
                      <h3 className="font-black text-slate-700 text-xl uppercase flex items-center gap-2 tracking-tight"><Calculator size={20} className="text-amber-500"/> RMD & Conversion Trajectory</h3>
                      <div className="flex gap-4 text-[9px] font-black uppercase text-slate-500">
                          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-amber-500 rounded-sm"/> Conversions</div>
                          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-rose-500 rounded-sm"/> RMDs</div>
                          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-slate-800 rounded-full"/> Taxes Paid</div>
                          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-rose-500 rounded-full"/> IRMAA Tier</div>
                      </div>
                   </div>
                   <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={annualTaxData} margin={{ top: 10, right: 30, left: 0, bottom: 35 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} stroke="#94a3b8" fontSize={11} tick={<CustomizedAxisTick baseYear={BASE_YEAR} currentAge={currentAge} />} />
                          <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 5]} ticks={[0,1,2,3,4,5]} stroke="#f43f5e" fontSize={11} tickFormatter={v=>`Tier ${v}`} />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === "IRMAA Tier") return [`Tier ${value}`, name];
                              return [formatUSD(value), name];
                            }} 
                            cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border:'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                          />
                          <Bar yAxisId="left" dataKey="conversion" stackId="a" fill="#f59e0b" name="Roth Conversion" />
                          <Bar yAxisId="left" dataKey="rmd" stackId="a" fill="#f43f5e" name="RMD" radius={[4,4,0,0]} />
                          <Line yAxisId="left" type="monotone" dataKey="taxPaid" stroke="#1e293b" strokeWidth={2} dot={false} name="Total Taxes" />
                          <Line yAxisId="right" type="stepAfter" dataKey="irmaaTier" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={{r:3}} name="IRMAA Tier" />
                        </ComposedChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                   <div className="flex flex-col gap-3">
                      <h4 className="font-black text-slate-700 text-lg uppercase flex items-center gap-2"><Sparkles size={18} className="text-indigo-500"/> Actionable AI Tax Strategist</h4>
                      <p className="text-xs font-bold text-slate-400">Generates personalized bracket recommendations based on your current inputs and the 2026 TCJA sunset.</p>
                      <div className="flex justify-start mt-2"><button onClick={fetchTaxAIInsights} disabled={isGeneratingTaxInsight} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-6 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-100 transition-all shadow-sm">{isGeneratingTaxInsight ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} Analyze Current Strategy</button></div>
                   </div>
                   {taxAiInsight && (
                     <div className="mt-6 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-sm text-slate-700 leading-relaxed space-y-4 animate-in fade-in">
                        {taxAiInsight.analysis.split('\n').map((p, idx) => p.trim() ? <p key={idx}>{p.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-black text-slate-800">{part}</strong> : part)}</p> : null)}
                        {taxAiInsight.applyChanges && (
                           <div className="pt-4 border-t border-indigo-200">
                              <button onClick={() => {
                                 if (taxAiInsight.strategy) setRothConversionStrategy(taxAiInsight.strategy);
                                 if (taxAiInsight.annualAmount !== undefined) setAnnualConversionAmount(taxAiInsight.annualAmount);
                                 if (taxAiInsight.bracket) setTargetMarginalBracket(taxAiInsight.bracket);
                                 if (taxAiInsight.duration) setConversionDuration(taxAiInsight.duration);
                                 setTaxAiInsight(null);
                              }} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-indigo-700 transition-all">
                                 Apply AI Recommendations
                              </button>
                           </div>
                        )}
                     </div>
                   )}
                </div>

                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200 flex items-start gap-4">
                   <div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><AlertTriangle size={24}/></div>
                   <div>
                      <h4 className="font-black text-blue-900 text-sm uppercase tracking-wider">Planning Insight: Moving to {destinationState} in {relocationYear}</h4>
                      <p className="text-xs text-blue-700 font-medium mt-1 leading-relaxed">Conversions performed before your move year will incur {STATE_TAX_RATES[currentState]}% state tax. After {relocationYear}, every $1 converted will cost an additional {STATE_TAX_RATES[destinationState] - STATE_TAX_RATES[currentState]}% in {destinationState} income tax. Consider front-loading Roth conversions before the relocation.</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {importModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 shadow-xl max-w-md w-full animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <Lock size={24} />
                <h3 className="text-lg font-black text-slate-800">Encrypted Backup</h3>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-4">This strategy file is encrypted. Please enter the password used to export it.</p>
              <input
                type="password"
                value={importModal.tempKey}
                onChange={e => setImportModal(prev => ({ ...prev, tempKey: e.target.value }))}
                placeholder="Decryption Password"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
              {importModal.error && <p className="text-xs text-red-500 font-bold mb-4">{importModal.error}</p>}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setImportModal({ isOpen: false, fileContent: null, error: '', tempKey: '' })} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-black rounded-xl text-xs uppercase hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={() => processImport(importModal.fileContent, importModal.tempKey)} className="flex-1 py-2.5 bg-blue-600 text-white font-black rounded-xl text-xs uppercase shadow-md hover:bg-blue-700 transition-all">Decrypt & Import</button>
              </div>
            </div>
          </div>
        )}

        {exportModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 shadow-xl max-w-md w-full animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-emerald-500 mb-4">
                <Lock size={24} />
                <h3 className="text-lg font-black text-slate-800">Secure Export</h3>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-4">Enter a password to encrypt your backup file. Leave blank for an unencrypted JSON file.</p>
              <input
                type="password"
                value={exportModal.tempKey}
                onChange={e => setExportModal(prev => ({ ...prev, tempKey: e.target.value }))}
                placeholder="Encryption Password (Optional)"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3 mt-2">
                <button onClick={() => setExportModal({ isOpen: false, tempKey: '' })} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-black rounded-xl text-xs uppercase hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={() => processExport(exportModal.tempKey)} className="flex-1 py-2.5 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase shadow-md hover:bg-emerald-700 transition-all">Export File</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <footer className="mt-8 border-t border-slate-200 pt-6 pb-12 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">v5.4 Local Engine • SECURE 2.0 / 2026 TCJA Modeling • Local AES-256 Enabled</p></footer>
    </div>
  );
};

export default App;