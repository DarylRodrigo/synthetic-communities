'use client';

import { useState, useEffect } from 'react';
import { fetchPersonas, Persona } from '@/lib/data';

export default function AudiencePersonasTab() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEducation, setFilterEducation] = useState('all');
    const [filterLocation, setFilterLocation] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const itemsPerPage = 8;

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

    const filteredAndSortedPersonas = personas
        .filter(persona => {
            const matchesSearch = persona.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEducation = filterEducation === 'all' || persona.education === filterEducation;
            const matchesLocation = filterLocation === 'all' || persona.location === filterLocation;
            return matchesSearch && matchesEducation && matchesLocation;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'age':
                    return a.age - b.age;
                case 'education':
                    return a.education.localeCompare(b.education);
                case 'location':
                    return a.location.localeCompare(b.location);
                default:
                    return 0;
            }
        });

    const totalPages = Math.ceil(filteredAndSortedPersonas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPersonas = filteredAndSortedPersonas.slice(startIndex, endIndex);

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

    const getAgeGroup = (age: number) => {
        if (age < 25) return '18-24';
        if (age < 35) return '25-34';
        if (age < 45) return '35-44';
        if (age < 55) return '45-54';
        return '55+';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-40 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Audience Personas</h2>
                <p className="text-sm text-gray-600 mt-1">Community members and their demographic profiles for targeted analysis</p>
            </div>

            {/* Filters and Controls */}
            <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    {option === 'all' ? 'All Education' : getEducationLabel(option)}
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="name">Name</option>
                            <option value="age">Age</option>
                            <option value="education">Education</option>
                            <option value="location">Location</option>
                        </select>
                    </div>
                </div>
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
                                <p className="text-sm text-gray-600">Age {persona.age} • {getAgeGroup(persona.age)}</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Education:</span>
                                    <span className="font-medium text-gray-900">
                                        {getEducationLabel(persona.education)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Location:</span>
                                    <span className="font-medium text-gray-900">
                                        {getLocationLabel(persona.location)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <button className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                    View Profile
                                </button>
                                <button className="w-full px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors">
                                    Analyze
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
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedPersonas.length)} of {filteredAndSortedPersonas.length} personas
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
