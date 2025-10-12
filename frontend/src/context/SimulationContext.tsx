'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SimulationState {
  isPlaying: boolean;
  speed: number;
  selectedSimulationId: string | null;
}

interface SimulationContextType {
  state: SimulationState;
  setPlaying: (isPlaying: boolean) => void;
  setSpeed: (speed: number) => void;
  setSimulation: (simulationId: string | null) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimulationState>({
    isPlaying: false,
    speed: 1,
    selectedSimulationId: null
  });

  const setPlaying = (isPlaying: boolean) => {
    setState(prev => ({ ...prev, isPlaying }));
  };

  const setSpeed = (speed: number) => {
    setState(prev => ({ ...prev, speed }));
  };

  const setSimulation = (selectedSimulationId: string | null) => {
    setState(prev => ({ ...prev, selectedSimulationId }));
  };

  return (
    <SimulationContext.Provider value={{ state, setPlaying, setSpeed, setSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
