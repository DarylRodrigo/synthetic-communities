'use client';

import { useState, useEffect } from 'react';
import { fetchNewsFeedData, NewsItem } from '@/lib/data';

export default function NewsFeedTab() {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const itemsPerPage = 5;

    useEffect(() => {
        loadNewsItems();
    }, []);

    const loadNewsItems = async () => {
        setLoading(true);
        try {
            const data = await fetchNewsFeedData();
            setNewsItems(data);
        } catch (error) {
            console.error('Failed to load news items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReaction = (itemId: string, emoji: string) => {
        setNewsItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const existingReaction = item.reactions.find(r => r.emoji === emoji);
                if (existingReaction) {
                    return {
                        ...item,
                        reactions: item.reactions.map(r => 
                            r.emoji === emoji 
                                ? { ...r, count: r.count + 1 }
                                : r
                        )
                    };
                } else {
                    return {
                        ...item,
                        reactions: [...item.reactions, { emoji, count: 1 }]
                    };
                }
            }
            return item;
        }));
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const categories = ['all', ...Array.from(new Set(newsItems.map(item => item.category)))];
    const filteredItems = selectedCategory === 'all' 
        ? newsItems 
        : newsItems.filter(item => item.category === selectedCategory);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredItems.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
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
                <h2 className="text-xl font-semibold text-gray-900">Community News Feed</h2>
                <p className="text-sm text-gray-600 mt-1">Latest updates and announcements from the community</p>
            </div>

            {/* Category Filter */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => {
                                setSelectedCategory(category);
                                setCurrentPage(1);
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                selectedCategory === category
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {category === 'all' ? 'All Categories' : category}
                        </button>
                    ))}
                </div>
            </div>

            {/* News Items */}
            <div className="divide-y divide-gray-200">
                {currentItems.map((item) => (
                    <div key={item.id} className="p-6">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {item.category}
                                    </span>
                                    <span className="text-sm text-gray-500">{formatTimestamp(item.timestamp)}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-700 mb-3">{item.content}</p>
                                <p className="text-sm text-gray-500">By {item.author}</p>
                            </div>
                        </div>
                        
                        {/* Reactions */}
                        <div className="flex items-center space-x-2 mt-4">
                            {item.reactions.map((reaction, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleReaction(item.id, reaction.emoji)}
                                    className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    <span className="text-lg">{reaction.emoji}</span>
                                    <span className="text-sm text-gray-600">{reaction.count}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => handleReaction(item.id, '👍')}
                                className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                            >
                                + React
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
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