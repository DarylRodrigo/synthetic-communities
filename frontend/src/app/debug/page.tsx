'use client';

import { useState } from 'react';
import DiscussionTab from '@/components/debug/DiscussionTab';
import NewsFeedTab from '@/components/debug/NewsFeedTab';
import CandidatePersonasTab from '@/components/debug/CandidatePersonasTab';
import AudiencePersonasTab from '@/components/debug/AudiencePersonasTab';
import ConnectionsTab from '@/components/debug/ConnectionsTab';

const tabs = [
    { id: 'discussion', name: 'Discussion', component: DiscussionTab },
    { id: 'news', name: 'News Feed', component: NewsFeedTab },
    { id: 'candidates', name: 'Candidate Personas', component: CandidatePersonasTab },
    { id: 'audience', name: 'Audience Personas', component: AudiencePersonasTab },
    { id: 'connections', name: 'Connections', component: ConnectionsTab },
];

export default function DebugPage() {
    const [activeTab, setActiveTab] = useState('discussion');

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DiscussionTab;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="py-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                            Debug Dashboard
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Monitor and analyze synthetic community data, interactions, and performance.
                        </p>
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
                        <ActiveComponent />
                    </div>
                </div>
            </div>
        </div>
    );
}
