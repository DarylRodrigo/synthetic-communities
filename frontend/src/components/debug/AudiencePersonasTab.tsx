'use client';

import { useState } from 'react';
import { useAudiencePersonas, useSimulationMetadata } from '@/lib/DataStore';
import { AudiencePersona } from '@/lib/data';

export default function AudiencePersonasTab() {
    const personas = useAudiencePersonas();
    const metadata = useSimulationMetadata();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPersona, setSelectedPersona] = useState<AudiencePersona | null>(null);
    const itemsPerPage = 8;

    const totalPages = Math.ceil(personas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPersonas = personas.slice(startIndex, endIndex);

    const getLocationLabel = (location: string) => {
        const labels: { [key: string]: string } = {
            'urban': 'Urban',
            'suburban': 'Suburban',
            'rural': 'Rural'
        };
        return labels[location] || location;
    };

    const getPersonaMetadata = (personaId: string) => {
        return metadata?.population.find(p => p.id === personaId);
    };


    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Audience Personas</h2>
                <p className="text-sm text-gray-600 mt-1">Community members and their demographic profiles</p>
            </div>

            {selectedPersona ? (
                /* Detailed Persona View */
                <div className="p-6">
                    <div className="mb-6">
                        <button
                            onClick={() => setSelectedPersona(null)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            ← Back to Personas
                        </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">{selectedPersona.name}</h3>
                        </div>

                        {(() => {
                            const personaMetadata = getPersonaMetadata(selectedPersona.id);
                            const demographics = personaMetadata?.demographics;
                            
                            if (!demographics) {
                                return (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <p className="text-gray-500 text-sm">No detailed demographic information available</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-6">
                                    {/* Basic Demographics */}
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Demographics</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Age:</span>
                                                <span className="font-medium text-gray-900">{demographics.age}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Gender:</span>
                                                <span className="font-medium text-gray-900">{demographics.gender}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">City:</span>
                                                <span className="font-medium text-gray-900">{demographics.city}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Job:</span>
                                                <span className="font-medium text-gray-900">{demographics.job}</span>
                                            </div>
                                            {demographics.company && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Company:</span>
                                                    <span className="font-medium text-gray-900">{demographics.company}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Education:</span>
                                                <span className="font-medium text-gray-900">{demographics.education_level.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Income:</span>
                                                <span className="font-medium text-gray-900">{demographics.income_bracket.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Country:</span>
                                                <span className="font-medium text-gray-900">{demographics.country}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cultural Background */}
                                    {(demographics.ethnicity || demographics.cultural_background || demographics.religion) && (
                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Cultural Background</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                {demographics.ethnicity && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Ethnicity:</span>
                                                        <span className="font-medium text-gray-900">{demographics.ethnicity}</span>
                                                    </div>
                                                )}
                                                {demographics.cultural_background && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Cultural Background:</span>
                                                        <span className="font-medium text-gray-900">{demographics.cultural_background}</span>
                                                    </div>
                                                )}
                                                {demographics.religion && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Religion:</span>
                                                        <span className="font-medium text-gray-900">{demographics.religion}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Personality Traits */}
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Personality Traits</h4>
                                        <div className="space-y-3">
                                            {Object.entries(demographics.personality_traits).map(([trait, value]) => (
                                                <div key={trait} className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 capitalize">{trait}:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-gray-600 h-2 rounded-full" 
                                                                style={{ width: `${value * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 w-8">{(value * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Behavioral Metrics */}
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Behavioral Metrics</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Susceptibility:</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-gray-600 h-2 rounded-full" 
                                                            style={{ width: `${demographics.susceptibility * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 w-8">{(demographics.susceptibility * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Trust in Institutions:</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-gray-600 h-2 rounded-full" 
                                                            style={{ width: `${demographics.trust_institution * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 w-8">{(demographics.trust_institution * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Turnout Propensity:</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-gray-600 h-2 rounded-full" 
                                                            style={{ width: `${demographics.turnout_propensity * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 w-8">{(demographics.turnout_propensity * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Confirmation Bias:</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-gray-600 h-2 rounded-full" 
                                                            style={{ width: `${demographics.confirmation_bias * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 w-8">{(demographics.confirmation_bias * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Social Network Influence:</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-gray-600 h-2 rounded-full" 
                                                            style={{ width: `${demographics.social_network_influence * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 w-8">{(demographics.social_network_influence * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Media Diet */}
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Media Consumption</h4>
                                        <div className="space-y-3">
                                            {Object.entries(demographics.media_diet).map(([media, value]) => (
                                                <div key={media} className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 capitalize">{media.replace('_', ' ')}:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-gray-600 h-2 rounded-full" 
                                                                style={{ width: `${value * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 w-8">{(value * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prior Beliefs */}
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Prior Beliefs</h4>
                                        <div className="space-y-3">
                                            {Object.entries(demographics.prior_beliefs).map(([belief, value]) => (
                                                <div key={belief} className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 capitalize">{belief.replace('_', ' ')}:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2 relative">
                                                            {/* Center line indicator */}
                                                            <div className="absolute left-1/2 top-0 w-px h-2 bg-gray-400 transform -translate-x-1/2"></div>
                                                            {/* Fill bar */}
                                                            <div 
                                                                className={`h-2 rounded-full ${value >= 0 ? 'bg-gray-600' : 'bg-gray-600'}`}
                                                                style={{ 
                                                                    width: `${Math.abs(value) * 50}%`,
                                                                    marginLeft: value >= 0 ? '50%' : `${50 - Math.abs(value) * 50}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 w-8">{value.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    {(demographics.demeanour || demographics.interests || demographics.backstory) && (
                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                                            <div className="space-y-4 text-sm">
                                                {demographics.demeanour && (
                                                    <div>
                                                        <span className="text-gray-600 font-medium">Demeanour:</span>
                                                        <p className="text-gray-700 mt-1">{demographics.demeanour}</p>
                                                    </div>
                                                )}
                                                {demographics.interests && demographics.interests.length > 0 && (
                                                    <div>
                                                        <span className="text-gray-600 font-medium">Interests:</span>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {demographics.interests.map((interest, index) => (
                                                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                                    {interest}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {demographics.backstory && (
                                                    <div>
                                                        <span className="text-gray-600 font-medium">Backstory:</span>
                                                        <p className="text-gray-700 mt-1 leading-relaxed">{demographics.backstory}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            ) : (
                /* Personas Grid */
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {currentPersonas.map((persona) => {
                            const personaMetadata = getPersonaMetadata(persona.id);
                            const demographics = personaMetadata?.demographics;
                            
                            return (
                                <div 
                                    key={persona.id} 
                                    onClick={() => setSelectedPersona(persona)}
                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md hover:bg-gray-100 transition-all duration-200"
                                >
                                    <div className="text-center mb-3">
                                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white font-semibold text-lg mx-auto mb-2">
                                            {persona.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">{persona.name}</h3>
                                        <p className="text-sm text-gray-600">Age {persona.age}</p>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Occupation:</span>
                                            <span className="font-medium text-gray-900 text-right">
                                                {persona.occupation}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Location:</span>
                                            <span className="font-medium text-gray-900">
                                                {getLocationLabel(persona.location)}
                                            </span>
                                        </div>
                                        {demographics && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Education:</span>
                                                    <span className="font-medium text-gray-900">
                                                        {demographics.education_level.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Income:</span>
                                                    <span className="font-medium text-gray-900">
                                                        {demographics.income_bracket.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {currentPersonas.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No personas found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination - only show when not viewing detailed persona */}
            {!selectedPersona && totalPages > 1 && (
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
