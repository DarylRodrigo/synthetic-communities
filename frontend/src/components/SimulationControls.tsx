'use client';

import { useState, useEffect } from 'react';
import { useDataStore, useSimulations, useSelectedSimulation, useDataLoading, useCurrentEpoch, useMaxEpochs } from '@/lib/DataStore';

interface SimulationControlsProps {
  onSimulationChange: (simulationId: string | null) => void;
  onPlayPause: (isPlaying: boolean) => void;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  speed: number;
}

export default function SimulationControls({
  onSimulationChange,
  onPlayPause,
  onSpeedChange,
  isPlaying,
  speed
}: SimulationControlsProps) {
  const { loadData } = useDataStore();
  const simulations = useSimulations();
  const selectedSimulation = useSelectedSimulation();
  const { loading, error } = useDataLoading();
  const currentEpoch = useCurrentEpoch();
  const maxEpochs = useMaxEpochs();

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
    { value: 3, label: '3x' },
    { value: 5, label: '5x' }
  ];

  const handleSimulationChange = (simulationId: string) => {
    onSimulationChange(simulationId);
    loadData();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Controls</h3>
      
      <div className="space-y-4">
        {/* Simulation Selection */}
        <div>
          <label htmlFor="simulation-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Simulation
          </label>
          <select
            id="simulation-select"
            value={selectedSimulation || ''}
            onChange={(e) => handleSimulationChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">Choose a simulation...</option>
            {simulations.map((sim) => (
              <option key={sim.id} value={sim.id}>
                {sim.id} ({sim.epoch_count} epochs)
              </option>
            ))}
          </select>
        </div>

        {/* Play/Pause Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onPlayPause(!isPlaying)}
            disabled={!selectedSimulation || loading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Play</span>
              </>
            )}
          </button>

          {/* Speed Control */}
          <div className="flex items-center space-x-2">
            <label htmlFor="speed-select" className="text-sm font-medium text-gray-700">
              Speed:
            </label>
            <select
              id="speed-select"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              disabled={!selectedSimulation || loading}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {speedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-gray-600">
            {loading ? 'Loading...' : isPlaying ? 'Playing' : 'Paused'}
          </span>
          {selectedSimulation && (
            <span className="text-gray-500">
              • {speed}x speed
            </span>
          )}
        </div>

        {/* Epoch Information */}
        {selectedSimulation && maxEpochs > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Current Epoch</h4>
                <p className="text-lg font-semibold text-blue-600">
                  {currentEpoch + 1} / {maxEpochs}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentEpoch + 1) / maxEpochs) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(((currentEpoch + 1) / maxEpochs) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <div className="text-red-400 mr-2">❌</div>
              <div className="text-red-800">
                <div className="font-semibold">Error</div>
                <div className="text-sm mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
