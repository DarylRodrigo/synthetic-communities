'use client';

import { useState, useEffect } from 'react';
import { fetchPersonas, Persona } from '@/lib/data';

export default function CandidatePersonasTab() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEducation, setFilterEducation] = useState('all');
    const [filterLocation, setFilterLocation] = useState('all');
    const itemsPerPage = 6;

    useEffect(() => {
        loadPersonas();
    }, []);

    const loadPersonas = async () => {
        setLoading(true);
        try {
            const data = await fetchPersonas();
            setPersonas(data);
        } catch (error) {
            console.error('Failed to load personas:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPersonas = personas.filter(persona => {
        const matchesSearch = persona.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEducation = filterEducation === 'all' || persona.education === filterEducation;
        const matchesLocation = filterLocation === 'all' || persona.location === filterLocation;
        return matchesSearch && matchesEducation && matchesLocation;
    });

    const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPersonas = filteredPersonas.slice(startIndex, endIndex);

    const educationOptions = ['all', ...Array.from(new Set(personas.map(p => p.education)))];
    const locationOptions = ['all', ...Array.from(new Set(personas.map(p => p.location)))];

    const getEducationLabel = (education: string) => {
        const labels: { [key: string]: string } = {
            'high_school': 'High School',
            'college': 'College',
            'graduate': 'Graduate',
            'trade_school': 'Trade School'
        };
        return labels[education] || education;
    };

    const getLocationLabel = (location: string) => {
        const labels: { [key: string]: string } = {
            'urban': 'Urban',
            'suburban': 'Suburban',
            'rural': 'Rural'
        };
        return labels[location] || location;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Candidate Personas</h2>
                <p className="text-sm text-gray-600 mt-1">Potential candidates for community participation and analysis</p>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search by name..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                        <select
                            value={filterEducation}
                            onChange={(e) => {
                                setFilterEducation(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {educationOptions.map(option => (
                                <option key={option} value={option}>
                                    {option === 'all' ? 'All Education Levels' : getEducationLabel(option)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <select
                            value={filterLocation}
                            onChange={(e) => {
                                setFilterLocation(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {locationOptions.map(option => (
                                <option key={option} value={option}>
                                    {option === 'all' ? 'All Locations' : getLocationLabel(option)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Personas Grid */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentPersonas.map((persona) => (
                        <div key={persona.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">{persona.name}</h3>
                                <span className="text-sm text-gray-500">Age {persona.age}</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Education:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {getEducationLabel(persona.education)}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Location:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {getLocationLabel(persona.location)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                    View Details
                                </button>
                                <button className="flex-1 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                                    Select
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {currentPersonas.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No personas found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredPersonas.length)} of {filteredPersonas.length} personas
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
