'use client';

import { DataStoreProvider } from '@/lib/DataStore';
import { SimulationProvider, useSimulation } from '@/context/SimulationContext';
import LiveDiscussionSection from '@/components/LiveDiscussionSection';
import LiveFeedSection from '@/components/LiveFeedSection';
import DiscussionContextSection from '@/components/DiscussionContextSection';
import SimulationControls from '@/components/SimulationControls';

function LivePageContent() {
  const { state: simulationState, setPlaying, setSpeed, setSimulation } = useSimulation();

  return (
    <div className="bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Live Community Simulation</h1>
          <p className="mt-2 text-lg text-gray-600">Real-time discussions and community activity</p>
        </div>
        
        {/* Simulation Controls */}
        <div className="mb-6">
          <SimulationControls
            onSimulationChange={setSimulation}
            onPlayPause={setPlaying}
            onSpeedChange={setSpeed}
            isPlaying={simulationState.isPlaying}
            speed={simulationState.speed}
          />
        </div>
        
        <div className="mt-4 grid gap-4 sm:gap-6 sm:mt-6 grid-cols-4 grid-rows-1 h-[500px] sm:h-[500px]">
          {/* Discussion Context - Left (spans 1 column) */}
          <DiscussionContextSection />

          {/* Candidate Debate - Center Left (spans 2 columns) */}
          <LiveDiscussionSection />

          {/* Social Media - Right (spans 1 column) */}
          <LiveFeedSection />
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  return (
    <DataStoreProvider>
      <SimulationProvider>
        <LivePageContent />
      </SimulationProvider>
    </DataStoreProvider>
  );
}
