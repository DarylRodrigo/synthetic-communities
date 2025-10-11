'use client';

import { useState } from 'react';
import { useAudiencePersonas } from '@/lib/DataStore';
import { AudiencePersona } from '@/lib/data';

export default function AudiencePersonasTab() {
    const personas = useAudiencePersonas();
    const [currentPage, setCurrentPage] = useState(1);
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


    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Audience Personas</h2>
                <p className="text-sm text-gray-600 mt-1">Community members and their demographic profiles</p>
            </div>

            {/* Personas Grid */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentPersonas.map((persona) => (
                        <div key={persona.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
                            <div className="text-center mb-3">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mx-auto mb-2">
                                    {persona.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">{persona.name}</h3>
                                <p className="text-sm text-gray-600">Age {persona.age}</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Occupation:</span>
                                    <span className="font-medium text-gray-900">
                                        {persona.occupation}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Location:</span>
                                    <span className="font-medium text-gray-900">
                                        {getLocationLabel(persona.location)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {currentPersonas.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No personas found.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
