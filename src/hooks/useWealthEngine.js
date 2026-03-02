import { useState, useEffect } from 'react';
import { runSimulationCore } from '../engine/simulationCore';

export const useWealthEngine = (defaultConfig) => {

  // 1. Initial Load: Check Browser Memory Before Using Defaults
  const loadInitialState = () => {
    try {
      const cachedSession = localStorage.getItem('wealthPlannerAutoSave');
      if (cachedSession) {
        return JSON.parse(cachedSession);
      }
    } catch (error) {
      console.error("Failed to read from local storage:", error);
    }
    return null;
  };

  const initialState = loadInitialState();

  // 2. Core State Management
  const [activeSlot, setActiveSlot] = useState(initialState?.activeSlot || 1);
  const [allCasesData, setAllCasesData] = useState(initialState?.allCasesData || {
    1: { ...defaultConfig, strategyName: 'Baseline Plan' },
    2: { ...defaultConfig, strategyName: 'Option 2' },
    3: { ...defaultConfig, strategyName: 'Option 3' }
  });
  
  const [activeConfig, setActiveConfig] = useState(initialState?.activeConfig || allCasesData[1]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [mcData, setMcData] = useState(initialState?.mcData || null);
  const [saveStatus, setSaveStatus] = useState('saved');

  // 3. The Auto-Save Engine: Silently cache on every change
  useEffect(() => {
    const sessionData = {
      activeSlot,
      activeConfig,
      allCasesData,
      mcData
    };
    localStorage.setItem('wealthPlannerAutoSave', JSON.stringify(sessionData));
  }, [activeSlot, activeConfig, allCasesData, mcData]);

  // 4. The Engine Run (With Master Event Filtering)
  useEffect(() => {
    setSaveStatus('saving');
    
    // Extract the master event list
    const masterEvents = activeConfig.events || [];
    
    // FILTER: Only pass events to the math engine if they have the current Case's checkbox ticked
    const activeEventsForThisCase = masterEvents.filter(ev => 
      !ev.cases || ev.cases.includes(activeSlot)
    );

    // Run the high-fidelity math engine
    const result = runSimulationCore(activeConfig, activeEventsForThisCase, false);
    setSimulationResult(result);
    
    // Auto-save the current state (including the master events list) into the background vault
    setAllCasesData(prev => ({
      ...prev,
      [activeSlot]: activeConfig
    }));

    const timer = setTimeout(() => setSaveStatus('saved'), 500);
    return () => clearTimeout(timer);
  }, [activeConfig, activeSlot]);

  // 5. Slot Switching Logic (The "Master List" Sync)
  const handleSlotChange = (newSlot) => {
    if (newSlot === activeSlot) return;
    
    // SECURE: Grab the master events list from the current case *before* we leave it
    const masterEvents = activeConfig.events || [];
    
    setActiveSlot(newSlot);
    
    // LOAD: Pull up the new case, but forcefully overwrite its events with our master list
    setActiveConfig({
      ...allCasesData[newSlot],
      events: masterEvents
    });
  };

  // 6. Manual Save, Export, and Import Methods
  const saveCurrentStrategy = () => {
    setAllCasesData(prev => ({ ...prev, [activeSlot]: activeConfig }));
    setSaveStatus('saved');
  };

  const processExport = (password) => {
    // Export the entire session so it loads perfectly on a new machine
    const exportPayload = JSON.stringify({ activeConfig, allCasesData, activeSlot, mcData }, null, 2);
    const blob = new Blob([exportPayload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const clientName = activeConfig.clientName ? activeConfig.clientName.replace(/\s+/g, '_') : 'Client';
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientName}_WealthPlan_v6.0.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const processImport = (jsonString, password) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Handle the new comprehensive export format
      if (parsed.activeConfig && parsed.allCasesData) {
         setActiveConfig(parsed.activeConfig);
         setAllCasesData(parsed.allCasesData);
         if (parsed.activeSlot) setActiveSlot(parsed.activeSlot);
         if (parsed.mcData) setMcData(parsed.mcData);
      } 
      // Backwards compatibility for older JSON files
      else if (parsed[1]) {
        setAllCasesData(parsed);
        const importedMasterEvents = parsed[1].events || [];
        setActiveConfig({
          ...parsed[1],
          events: importedMasterEvents
        });
        setActiveSlot(1);
      }
    } catch (error) {
      console.error("Failed to parse import file", error);
      alert("Invalid file format. Please upload a valid v6.0 JSON export.");
    }
  };

  return {
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
  };
};