'use client';

import { useState, useEffect } from 'react';
import { usePopulationVotes, useRawData } from '@/lib/DataStore';
import { PopulationVote } from '@/lib/data';

export default function VotesTab() {
    const populationVotes = usePopulationVotes();
    const rawData = useRawData();
    const [filterType, setFilterType] = useState('overall');
    const [selectedTopic, setSelectedTopic] = useState<string>('all');
    const [selectedVoter, setSelectedVoter] = useState<PopulationVote | null>(null);

    // Get available topics from debates
    const availableTopics = rawData?.debates?.map(debate => ({
        id: debate.topic.id,
        title: debate.topic.title
    })) || [];

    // Filter votes based on selected criteria
    const filteredVotes = populationVotes.filter(vote => {
        if (filterType === 'overall') {
            return true; // Show all votes
        } else if (filterType === 'epoch') {
            return true; // For now, all votes are from current epoch
        } else if (filterType === 'topic' && selectedTopic !== 'all') {
            return vote.policy_positions[selectedTopic] !== undefined;
        }
        return true;
    });

    const getVoteColor = (vote: string) => {
        const colors: { [key: string]: string } = {
            'candidate_1': '#10B981', // green
            'candidate_2': '#3B82F6', // blue
            'candidate_3': '#F59E0B', // yellow
            'candidate_4': '#EF4444'  // red
        };
        return colors[vote] || '#6B7280';
    };

    const getCandidateName = (candidateId: string) => {
        const candidate = rawData?.candidates?.find(c => c.id === candidateId);
        return candidate?.name || candidateId;
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const handleVoterClick = (voter: PopulationVote) => {
        setSelectedVoter(selectedVoter?.id === voter.id ? null : voter);
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Audience Votes</h2>
                <p className="text-sm text-gray-600 mt-1">Click on any voter to see their detailed voting information</p>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Filter by:</label>
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setSelectedVoter(null);
                            }}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="overall">Overall Votes</option>
                            <option value="epoch">By Epoch</option>
                            <option value="topic">By Topic</option>
                        </select>
                    </div>

                    {filterType === 'topic' && (
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Topic:</label>
                            <select
                                value={selectedTopic}
                                onChange={(e) => {
                                    setSelectedTopic(e.target.value);
                                    setSelectedVoter(null);
                                }}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Topics</option>
                                {availableTopics.map(topic => (
                                    <option key={topic.id} value={topic.id}>
                                        {topic.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Vote Statistics */}
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Vote Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {rawData?.candidates?.map((candidate, index) => {
                        const candidateId = `candidate_${index + 1}`;
                        const votes = populationVotes.filter(vote => vote.overall_vote === candidateId).length;
                        const percentage = populationVotes.length > 0 ? (votes / populationVotes.length * 100).toFixed(1) : 0;

                        return (
                            <div key={candidateId} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                                    <span className="text-sm text-gray-600">{percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: getVoteColor(candidateId)
                                        }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{votes} votes</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Voter Grid */}
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Voters Grid</h3>
                    <div className="text-sm text-gray-600">
                        {filteredVotes.length} {filterType === 'topic' && selectedTopic !== 'all' ? 'voters' : 'total voters'}
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
                    {filteredVotes.map((voter) => (
                        <div
                            key={voter.id}
                            onClick={() => handleVoterClick(voter)}
                            className={`
                                aspect-square rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg
                                flex flex-col items-center justify-center text-white font-medium text-sm
                                ${selectedVoter?.id === voter.id ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}
                            `}
                            style={{
                                backgroundColor: getVoteColor(voter.overall_vote),
                                borderColor: selectedVoter?.id === voter.id ? '#3B82F6' : 'transparent'
                            }}
                            title={`${voter.name} - ${getCandidateName(voter.overall_vote)}`}
                        >
                            <div className="text-center">
                                <div className="text-lg font-bold">
                                    {getInitials(voter.name)}
                                </div>
                                <div className="text-xs opacity-90 mt-1">
                                    {voter.demographics.age}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredVotes.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No votes found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Selected Voter Details */}
            {selectedVoter && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">{selectedVoter.name}</h3>
                            <p className="text-sm text-gray-600">
                                {selectedVoter.demographics.age} years old • {selectedVoter.demographics.occupation} • {selectedVoter.demographics.location}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedVoter(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Overall Vote:</span>
                            <span
                                className="px-3 py-1 rounded text-sm font-medium text-white"
                                style={{ backgroundColor: getVoteColor(selectedVoter.overall_vote) }}
                            >
                                {getCandidateName(selectedVoter.overall_vote)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-900">Topic-by-Topic Votes</h4>
                        {Object.entries(selectedVoter.policy_positions).map(([topicId, position]) => {
                            const topic = availableTopics.find(t => t.id === topicId);
                            return (
                                <div key={topicId} className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-medium text-gray-900">
                                            {topic?.title || topicId}
                                        </h5>
                                        <span
                                            className="px-2 py-1 rounded text-sm font-medium text-white"
                                            style={{ backgroundColor: getVoteColor(position.vote) }}
                                        >
                                            {getCandidateName(position.vote)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {position.reasoning}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
