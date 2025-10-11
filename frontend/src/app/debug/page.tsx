'use client';

import { useState } from 'react';
import { DataStoreProvider, useDataStore, useDataLoading } from '@/lib/DataStore';
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
    const { refreshData } = useDataStore();
    const { loading, error } = useDataLoading();

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DiscussionTab;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="py-8">
                    <div className="text-center">

                        {/* Data Status and Refresh */}
                        <div className="mt-6 flex flex-col items-center space-y-4">
                            <button
                                onClick={refreshData}
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
