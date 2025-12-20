import React, { createContext, useContext, useState } from 'react';

const AudioMonitorContext = createContext();

export function AudioMonitorProvider({ children }) {
  const [isAudioMonitorActive, setIsAudioMonitorActive] = useState(false);
  const [riskLevel, setRiskLevel] = useState(0);

  const value = {
    isAudioMonitorActive,
    setIsAudioMonitorActive,
    riskLevel,
    setRiskLevel
  };

  return (
    <AudioMonitorContext.Provider value={value}>
      {children}
    </AudioMonitorContext.Provider>
  );
}

export function useAudioMonitor() {
  const context = useContext(AudioMonitorContext);
  if (!context) {
    throw new Error('useAudioMonitor must be used within AudioMonitorProvider');
  }
  return context;
}
