import { runSimulationCore } from '../engine/simulationCore';

// The worker "listens" for a message from the main app
self.onmessage = (e) => {
  const { config, events, mcSettings, mcSimCount, activeSlot, allCasesData, defaultConfig } = e.data;
  
  const newMcData = {};
  
  // Run the loop exactly like we did in App.jsx, but on this background thread
  for (let slot of [1, 2, 3]) {
    const targetConfig = slot === activeSlot ? config : (allCasesData[slot] || defaultConfig);
    const targetEvents = events.filter(e => e.applicableSlots?.includes(slot) ?? true);
    let successCount = 0, percentilesData = [];
    let terminalBalances = [], allPaths = [];

    for (let i = 0; i < mcSimCount; i++) {
      const { data: path, isBroke, finalBalance } = runSimulationCore(targetConfig, targetEvents, true, mcSettings);
      if (!isBroke) successCount++;
      allPaths.push(path);
      terminalBalances.push(finalBalance);
    }

    if (allPaths.length > 0) {
      const timePoints = allPaths[0].length;
      for (let t = 0; t < timePoints; t++) {
        const balances = allPaths.map(p => p[t].balance).sort((a, b) => a - b);
        percentilesData.push({ 
          age: allPaths[0][t].age, 
          p10: Math.round(balances[Math.floor(mcSimCount * 0.10)]), 
          median: Math.round(balances[Math.floor(mcSimCount * 0.50)]), 
          p90: Math.round(balances[Math.floor(mcSimCount * 0.90)]) 
        });
      }
    }
    newMcData[slot] = { successProbability: (successCount / mcSimCount) * 100, percentilesData };
  }

  // Send the finished data back to the main app
  self.postMessage(newMcData);
};