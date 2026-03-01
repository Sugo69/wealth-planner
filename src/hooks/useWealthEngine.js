import { useState, useMemo, useEffect, useCallback } from 'react';
import { auth, db, appId, onAuthStateChanged, doc, setDoc, getDoc } from '../services/firebase';
import { runSimulationCore } from '../engine/simulationCore';

export const useWealthEngine = (defaultConfig) => {
  const [user, setUser] = useState(null);
  const [activeSlot, setActiveSlot] = useState(1);
  const [allCasesData, setAllCasesData] = useState({});
  const [activeConfig, setActiveConfig] = useState(defaultConfig);
  const [mcData, setMcData] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle');

  // Auth Lifecycle
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // Fetch all cases from Firebase on login
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const newAllCases = {};
      for (let i of [1, 2, 3]) {
        const docSnap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'saved_strategies', i.toString()));
        if (docSnap.exists()) newAllCases[i] = docSnap.data();
      }
      setAllCasesData(newAllCases);
      if (newAllCases[activeSlot]) setActiveConfig(newAllCases[activeSlot]);
    };
    fetchAll();
  }, [user, activeSlot]);

  // The Master Simulation - Deterministic
  const simulationResult = useMemo(() => {
    return runSimulationCore(activeConfig, [], false);
  }, [activeConfig]);

  // Handle Case Switching
  const handleSlotChange = (newSlot) => {
    if (activeSlot !== newSlot) {
      setAllCasesData(prev => ({ ...prev, [activeSlot]: activeConfig }));
      setActiveSlot(newSlot);
      setActiveConfig(allCasesData[newSlot] || defaultConfig);
    }
  };

  const saveCurrentStrategy = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'saved_strategies', activeSlot.toString()), {
        ...activeConfig,
        updatedAt: new Date().toISOString()
      });
      setAllCasesData(prev => ({ ...prev, [activeSlot]: activeConfig }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  return {
    user, activeSlot, allCasesData, activeConfig, setActiveConfig,
    simulationResult, mcData, setMcData, saveStatus, 
    handleSlotChange, saveCurrentStrategy
  };
};