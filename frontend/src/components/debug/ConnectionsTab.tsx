'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchConnectionsData, Connection } from '@/lib/data';

export default function ConnectionsTab() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterType, setFilterType] = useState('all');
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        loadConnections();
    }, []);

    useEffect(() => {
        if (connections.length > 0) {
            drawGraph();
        }
    }, [connections, selectedNode]);

    const loadConnections = async () => {
        setLoading(true);
        try {
            const data = await fetchConnectionsData();
            setConnections(data);
        } catch (error) {
            console.error('Failed to load connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredConnections = filterType === 'all'
        ? connections
        : connections.filter(conn => conn.type === filterType);

    const totalPages = Math.ceil(filteredConnections.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentConnections = filteredConnections.slice(startIndex, endIndex);

    const getTypeOptions = () => {
        return ['all', ...Array.from(new Set(connections.map(conn => conn.type)))];
    };

    const getTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'strong': '#10B981', // green
            'moderate': '#F59E0B', // yellow
            'weak': '#EF4444' // red
        };
        return colors[type] || '#6B7280';
    };

    const drawGraph = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

        // Get unique nodes
        const nodes = Array.from(new Set([
            ...connections.map(conn => conn.from),
            ...connections.map(conn => conn.to)
        ]));

        // Calculate node positions in a circle
        const centerX = canvas.offsetWidth / 2;
        const centerY = canvas.offsetHeight / 2;
        const radius = Math.min(centerX, centerY) - 50;

        const nodePositions: { [key: string]: { x: number; y: number } } = {};
        nodes.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / nodes.length;
            nodePositions[node] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        // Draw connections
        connections.forEach(connection => {
            const fromPos = nodePositions[connection.from];
            const toPos = nodePositions[connection.to];

            if (fromPos && toPos) {
                ctx.beginPath();
                ctx.moveTo(fromPos.x, fromPos.y);
                ctx.lineTo(toPos.x, toPos.y);

                // Line width based on strength
                ctx.lineWidth = connection.strength * 3 + 1;
                ctx.strokeStyle = getTypeColor(connection.type);
                ctx.globalAlpha = 0.6;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        });

        // Draw nodes
        nodes.forEach(node => {
            const pos = nodePositions[node];
            if (pos) {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);

                if (selectedNode === node) {
                    ctx.fillStyle = '#3B82F6';
                    ctx.strokeStyle = '#1D4ED8';
                    ctx.lineWidth = 3;
                } else {
                    ctx.fillStyle = '#6B7280';
                    ctx.strokeStyle = '#374151';
                    ctx.lineWidth = 2;
                }

                ctx.fill();
                ctx.stroke();

                // Draw node label
                ctx.fillStyle = '#1F2937';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(node.split(' ')[0], pos.x, pos.y + 4);
            }
        });
    };

    const handleNodeClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if click is near any node
        const nodes = Array.from(new Set([
            ...connections.map(conn => conn.from),
            ...connections.map(conn => conn.to)
        ]));

        const centerX = canvas.offsetWidth / 2;
        const centerY = canvas.offsetHeight / 2;
        const radius = Math.min(centerX, centerY) - 50;

        nodes.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / nodes.length;
            const nodeX = centerX + radius * Math.cos(angle);
            const nodeY = centerY + radius * Math.sin(angle);

            const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
            if (distance < 25) {
                setSelectedNode(selectedNode === node ? null : node);
            }
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Connection Network</h2>
                <p className="text-sm text-gray-600 mt-1">Interactive visualization of community member relationships and connections</p>
            </div>

            {/* Graph Visualization */}
            <div className="p-6 border-b border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Network Graph</h3>
                        <div className="flex space-x-2">
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Strong</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Moderate</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Weak</span>
                            </div>
                        </div>
                    </div>
                    <canvas
                        ref={canvasRef}
                        className="w-full h-64 border border-gray-200 rounded cursor-pointer"
                        onClick={handleNodeClick}
                    />
                    {selectedNode && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                                Selected: <span className="font-medium">{selectedNode}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Connection List */}
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Connection Details</h3>
                    <select
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {getTypeOptions().map(type => (
                            <option key={type} value={type}>
                                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    {currentConnections.map((connection) => (
                        <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">{connection.from}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="font-medium text-gray-900">{connection.to}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getTypeColor(connection.type) }}
                                    ></div>
                                    <span className="text-sm text-gray-600 capitalize">{connection.type}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-600">
                                    Strength: {(connection.strength * 100).toFixed(0)}%
                                </div>
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${connection.strength * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {currentConnections.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No connections found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredConnections.length)} of {filteredConnections.length} connections
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
