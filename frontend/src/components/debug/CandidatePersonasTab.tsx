'use client';

import { useState, useEffect } from 'react';
import { useCandidatePersonas, useSimulationMetadata } from '@/lib/DataStore';
import { CandidatePersona } from '@/lib/data';

export default function CandidatePersonasTab() {
    const personas = useCandidatePersonas();
    const metadata = useSimulationMetadata();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCandidate, setSelectedCandidate] = useState<CandidatePersona | null>(null);
    const itemsPerPage = 6;

    // Get candidate names for color assignment (same logic as discussion tab)
    const candidateNames = personas.map(persona => persona.name);

    // Update selectedCandidate when personas data changes (epoch change)
    useEffect(() => {
        if (selectedCandidate && personas.length > 0) {
            // Find the updated candidate data with the same ID
            const updatedCandidate = personas.find(p => p.id === selectedCandidate.id);
            if (updatedCandidate) {
                console.log('🔄 Updating selected candidate with new epoch data:', updatedCandidate.name);
                setSelectedCandidate(updatedCandidate);
            }
        }
    }, [personas, selectedCandidate]);

    const totalPages = Math.ceil(personas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPersonas = personas.slice(startIndex, endIndex);

    const getTopicTitle = (topicId: string) => {
        // First try to find the topic in metadata
        const topic = metadata?.topics.find(t => t.id === topicId);
        if (topic) {
            return topic.title;
        }
        
        // Fallback to hardcoded titles
        const titles: { [key: string]: string } = {
            'topic_1': 'Healthcare Reform',
            'topic_2': 'Climate Change and Energy Policy',
            'topic_3': 'Economic Policy',
            'topic_4': 'Education Reform',
            'climate_policy': 'Climate Change and Energy Policy',
            'healthcare_reform': 'Healthcare Access and Affordability',
            'economic_policy': 'Economic Policy',
            'education_reform': 'Education Reform'
        };
        return titles[topicId] || topicId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Candidate Personas</h2>
            </div>

            {selectedCandidate ? (
                /* Detailed Candidate View */
                <div className="p-6">
                    <div className="mb-6">
                        <button
                            onClick={() => setSelectedCandidate(null)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            ← Back to Candidates
                        </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">{selectedCandidate.name}</h3>
                        </div>

                        {/* Character Information */}
                        <div className="mb-8">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Character Profile</h4>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                {(() => {
                                    const candidateMetadata = metadata?.candidates.find(c => c.id === selectedCandidate.id);
                                    return candidateMetadata ? (
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {candidateMetadata.character}
                                        </p>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No character information available</p>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Current Policy Positions */}
                        <div className="mb-8">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Policy Positions</h4>
                            <div className="space-y-6">
                                {Object.entries(selectedCandidate.policy_positions).map(([topicId, position]) => (
                                    <div key={topicId} className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h5 className="font-medium text-gray-900 mb-2">{getTopicTitle(topicId)}</h5>
                                        <p className="text-gray-700 text-sm leading-relaxed">{position}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Initial Policy Positions */}
                        {(() => {
                            const candidateMetadata = metadata?.candidates.find(c => c.id === selectedCandidate.id);
                            return candidateMetadata && Object.keys(candidateMetadata.initial_policy_positions).length > 0 ? (
                                <div className="mb-8">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Initial Policy Positions</h4>
                                    <div className="space-y-6">
                                        {Object.entries(candidateMetadata.initial_policy_positions).map(([topicId, position]) => (
                                            <div key={topicId} className="bg-white rounded-lg p-4 border border-gray-200">
                                                <h5 className="font-medium text-gray-900 mb-2">{getTopicTitle(topicId)}</h5>
                                                <p className="text-gray-700 text-sm leading-relaxed">{position}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {/* Reflections */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3">State Memory & Reflection</h4>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                                {selectedCandidate.social_media_reflection}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Candidates Grid */
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentPersonas.map((persona) => {
                            // Determine color based on candidate position (same logic as discussion tab)
                            const isCandidate1 = persona.name === candidateNames[0];
                            const isCandidate2 = persona.name === candidateNames[1];
                            
                            let cardClass = 'bg-gray-50 border-gray-200';
                            let hoverClass = 'hover:bg-gray-100';
                            let textClass = 'text-gray-900';
                            
                            if (isCandidate1) {
                                cardClass = 'bg-blue-50 border-blue-200';
                                hoverClass = 'hover:bg-blue-100';
                                textClass = 'text-blue-900';
                            } else if (isCandidate2) {
                                cardClass = 'bg-red-50 border-red-200';
                                hoverClass = 'hover:bg-red-100';
                                textClass = 'text-red-900';
                            }
                            
                            return (
                                <div 
                                    key={persona.id} 
                                    onClick={() => setSelectedCandidate(persona)}
                                    className={`${cardClass} rounded-lg p-4 border cursor-pointer ${hoverClass} hover:shadow-md transition-all duration-200`}
                                >
                                    <div className="text-center">
                                        <h3 className={`text-lg font-semibold ${textClass}`}>{persona.name}</h3>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {currentPersonas.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No personas found matching your criteria.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination - only show when not viewing detailed candidate */}
            {!selectedCandidate && totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(endIndex, personas.length)} of {personas.length} personas
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
