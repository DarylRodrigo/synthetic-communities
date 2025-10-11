'use client';

import { useState } from 'react';
import { DataStoreProvider, useDataStore, useDataLoading, useSimulations, useSelectedSimulation, useCurrentEpoch, useMaxEpochs } from '@/lib/DataStore';
import DiscussionTab from '@/components/debug/DiscussionTab';
import NewsFeedTab from '@/components/debug/NewsFeedTab';
import CandidatePersonasTab from '@/components/debug/CandidatePersonasTab';
import AudiencePersonasTab from '@/components/debug/AudiencePersonasTab';
import VotesTab from '@/components/debug/VotesTab';

const tabs = [
    { id: 'discussion', name: 'Discussion', component: DiscussionTab },
    { id: 'news', name: 'News Feed', component: NewsFeedTab },
    { id: 'candidates', name: 'Candidate Personas', component: CandidatePersonasTab },
    { id: 'audience', name: 'Audience Personas', component: AudiencePersonasTab },
    { id: 'votes', name: 'Votes', component: VotesTab },
];

function DebugPageContent() {
    const [activeTab, setActiveTab] = useState('discussion');
    const { loadData, selectSimulation, selectEpoch } = useDataStore();
    const { loading, error } = useDataLoading();
    const simulations = useSimulations();
    const selectedSimulation = useSelectedSimulation();
    const currentEpoch = useCurrentEpoch();
    const maxEpochs = useMaxEpochs();

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DiscussionTab;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="py-8">
                    <div className="text-center">

                        {/* Simulation Selection and Data Refresh */}
                        <div className="mt-6 flex flex-col items-center space-y-4">
                            {/* Simulation Dropdown */}
                            <div className="flex flex-col items-center space-y-2">
                                <label htmlFor="simulation-select" className="text-sm font-medium text-gray-700">
                                    Select Simulation:
                                </label>
                                <select
                                    id="simulation-select"
                                    value={selectedSimulation || ''}
                                    onChange={(e) => selectSimulation(e.target.value || null)}
                                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                                >
                                    <option value="">Auto-select latest</option>
                                    {simulations.map((sim) => (
                                        <option key={sim.id} value={sim.id}>
                                            {sim.id} ({sim.epoch_count} epochs)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Epoch Slider */}
                            {maxEpochs > 0 && (
                                <div className="flex flex-col items-center space-y-2">
                                    <label htmlFor="epoch-slider" className="text-sm font-medium text-gray-700">
                                        Epoch {currentEpoch + 1}
                                    </label>
                                    <input
                                        id="epoch-slider"
                                        type="range"
                                        min="0"
                                        max={maxEpochs - 1}
                                        value={currentEpoch}
                                        onChange={(e) => selectEpoch(parseInt(e.target.value))}
                                        className="w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                        style={{
                                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentEpoch + 1) / maxEpochs) * 100}%, #e5e7eb ${((currentEpoch + 1) / maxEpochs) * 100}%, #e5e7eb 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between w-64 text-xs text-gray-500">
                                        <span>1</span>
                                        <span>{maxEpochs}</span>
                                    </div>
                                </div>
                            )}

                            {/* Refresh Data Button */}
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Loading...' : 'Refresh Data'}
                            </button>
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
                                    <div className="flex items-center">
                                        <div className="text-red-400 mr-2">❌</div>
                                        <div className="text-red-800">
                                            <div className="font-semibold">Data Loading Error</div>
                                            <div className="text-sm mt-1">{error}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mt-12">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-8">
                        {loading ? (
                            <div className="bg-white rounded-lg shadow p-8">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <div className="text-lg font-medium text-gray-900">Loading data...</div>
                                    <div className="text-sm text-gray-600 mt-2">Please wait while we fetch the latest data</div>
                                </div>
                            </div>
                        ) : (
                            <ActiveComponent />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DebugPage() {
    return (
        <DataStoreProvider>
            <DebugPageContent />
        </DataStoreProvider>
    );
}
