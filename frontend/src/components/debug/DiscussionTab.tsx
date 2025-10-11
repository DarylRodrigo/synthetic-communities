'use client';

import { useState } from 'react';
import { useRawData } from '@/lib/DataStore';

export default function DiscussionTab() {
    const epochData = useRawData();
    const [expandedDebates, setExpandedDebates] = useState<Set<number>>(new Set([0])); // First debate expanded by default

    const toggleDebate = (debateIndex: number) => {
        const newExpanded = new Set(expandedDebates);
        if (newExpanded.has(debateIndex)) {
            newExpanded.delete(debateIndex);
        } else {
            newExpanded.add(debateIndex);
        }
        setExpandedDebates(newExpanded);
    };

    if (!epochData || !epochData.debates) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Community Discussion</h2>
                    <p className="text-sm text-gray-600 mt-1">Loading debate data...</p>
                </div>
                <div className="p-6">
                    <p className="text-gray-500">No debate data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Community Discussion</h2>
                <p className="text-sm text-gray-600 mt-1">Debate topics and candidate statements</p>
            </div>

            <div className="h-[70vh] overflow-y-auto p-6 space-y-4">
                {epochData.debates.map((debate, debateIndex) => {
                    const isExpanded = expandedDebates.has(debateIndex);
                    const candidateNames = [...new Set(debate.statements
                        .filter(s => s.type === 'candidate')
                        .map(s => s.candidate_name)
                        .filter(Boolean))];

                    return (
                        <div key={debateIndex} className="border border-gray-200 rounded-lg">
                            {/* Topic Header - Always Visible */}
                            <div
                                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => toggleDebate(debateIndex)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {debate.topic.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {debate.topic.description}
                                        </p>
                                    </div>
                                    <div className="ml-4">
                                        <svg
                                            className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Debate Statements - Collapsible */}
                            {isExpanded && (
                                <div className="p-4 space-y-3">
                                    {debate.statements.map((statement, statementIndex) => {
                                        const isModerator = statement.type === 'mediator';
                                        const isCandidate1 = statement.candidate_name === candidateNames[0];
                                        const isCandidate2 = statement.candidate_name === candidateNames[1];

                                        // Determine styling based on speaker
                                        let alignmentClass = 'justify-start';
                                        let bubbleClass = 'bg-gray-100 text-gray-900 rounded-bl-md';
                                        let textColor = 'text-gray-800';
                                        let authorColor = 'text-gray-600';

                                        if (isModerator) {
                                            alignmentClass = 'justify-center';
                                            bubbleClass = 'bg-green-50 text-gray-900 rounded-md border border-green-200';
                                            textColor = 'text-gray-800';
                                            authorColor = 'text-green-700';
                                        } else if (isCandidate1) {
                                            alignmentClass = 'justify-start';
                                            bubbleClass = 'bg-blue-50 text-gray-900 rounded-bl-md border border-blue-200';
                                            textColor = 'text-gray-800';
                                            authorColor = 'text-blue-700';
                                        } else if (isCandidate2) {
                                            alignmentClass = 'justify-end';
                                            bubbleClass = 'bg-red-50 text-gray-900 rounded-br-md border border-red-200';
                                            textColor = 'text-gray-800';
                                            authorColor = 'text-red-700';
                                        }

                                        return (
                                            <div key={statementIndex} className={`flex ${alignmentClass}`}>
                                                <div className={`max-w-2xl px-4 py-3 rounded-2xl ${bubbleClass}`}>
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className={`text-sm font-medium ${authorColor}`}>
                                                            {statement.candidate_name || 'Moderator'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {statement.type === 'mediator' ? 'Moderator' : 'Candidate'}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm ${textColor} leading-relaxed`}>
                                                        {statement.statement}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}