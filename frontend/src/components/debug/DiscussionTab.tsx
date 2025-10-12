'use client';

import { useState } from 'react';
import { useRawData, useSimulationMetadata } from '@/lib/DataStore';

export default function DiscussionTab() {
    const epochData = useRawData();
    const metadata = useSimulationMetadata();
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set()); // Track expanded topics
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set()); // Track expanded questions

    const toggleTopic = (topicId: string) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(topicId)) {
            newExpanded.delete(topicId);
        } else {
            newExpanded.add(topicId);
        }
        setExpandedTopics(newExpanded);
    };

    const toggleQuestion = (questionId: string) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(questionId)) {
            newExpanded.delete(questionId);
        } else {
            newExpanded.add(questionId);
        }
        setExpandedQuestions(newExpanded);
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
                {(() => {
                    // Group debates by topic
                    const debatesByTopic = epochData.debates.reduce((acc, debate) => {
                        if (!acc[debate.topic_id]) {
                            acc[debate.topic_id] = [];
                        }
                        acc[debate.topic_id].push(debate);
                        return acc;
                    }, {} as Record<string, typeof epochData.debates>);

                    return Object.entries(debatesByTopic).map(([topicId, debates]) => {
                        const topic = metadata?.topics.find(t => t.id === topicId);
                        const isTopicExpanded = expandedTopics.has(topicId);

                        return (
                            <div key={topicId} className="border border-gray-200 rounded-lg">
                                {/* Topic Header */}
                                <div
                                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => toggleTopic(topicId)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {topic?.title || topicId}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {topic?.description || 'No description available'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {debates.length} question{debates.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <svg
                                                className={`w-5 h-5 text-gray-500 transform transition-transform ${isTopicExpanded ? 'rotate-180' : ''
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

                                {/* Questions within Topic */}
                                {isTopicExpanded && (
                                    <div className="space-y-2">
                                        {debates.map((debate, debateIndex) => {
                                            const isQuestionExpanded = expandedQuestions.has(debate.question.id);
                                            
                                            // Get candidate names from metadata
                                            const candidateNames = [...new Set(debate.statements
                                                .filter(s => s.type === 'candidate' && s.candidate_id)
                                                .map(s => {
                                                    const candidate = metadata?.candidates.find(c => c.id === s.candidate_id);
                                                    return candidate?.name || s.candidate_id;
                                                })
                                                .filter(Boolean))];

                                            return (
                                                <div key={debate.question.id} className="border-l-4 border-blue-200 ml-4">
                                                    {/* Question Header */}
                                                    <div
                                                        className="p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                                                        onClick={() => toggleQuestion(debate.question.id)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-blue-900">
                                                                    Question {debateIndex + 1}: {debate.question.text}
                                                                </p>
                                                            </div>
                                                            <div className="ml-4">
                                                                <svg
                                                                    className={`w-4 h-4 text-blue-600 transform transition-transform ${isQuestionExpanded ? 'rotate-180' : ''
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

                                                    {/* Debate Statements */}
                                                    {isQuestionExpanded && (
                                                        <div className="p-4 space-y-3">
                                                            {debate.statements.map((statement, statementIndex) => {
                                                                const isModerator = statement.type === 'mediator';
                                                                
                                                                // Get candidate name from metadata
                                                                let candidateName = 'Moderator';
                                                                if (statement.type === 'candidate' && statement.candidate_id) {
                                                                    const candidate = metadata?.candidates.find(c => c.id === statement.candidate_id);
                                                                    candidateName = candidate?.name || statement.candidate_id;
                                                                }
                                                                
                                                                const isCandidate1 = candidateName === candidateNames[0];
                                                                const isCandidate2 = candidateName === candidateNames[1];

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
                                                                                    {candidateName}
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
                                )}
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
}