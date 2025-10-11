'use client';

import { useState, useEffect } from 'react';
import { fetchDiscussionData, DiscussionMessage } from '@/lib/data';

export default function DiscussionTab() {
    const [messages, setMessages] = useState<DiscussionMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const messagesPerPage = 10;

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const data = await fetchDiscussionData();
            setMessages(data);
        } catch (error) {
            console.error('Failed to load discussion messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message: DiscussionMessage = {
                id: Date.now().toString(),
                author: 'You',
                content: newMessage,
                timestamp: new Date().toISOString(),
                reactions: []
            };
            setMessages(prev => [message, ...prev]);
            setNewMessage('');
        }
    };

    const handleReaction = (messageId: string, emoji: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const existingReaction = msg.reactions.find(r => r.emoji === emoji);
                if (existingReaction) {
                    return {
                        ...msg,
                        reactions: msg.reactions.map(r => 
                            r.emoji === emoji 
                                ? { ...r, count: r.count + 1 }
                                : r
                        )
                    };
                } else {
                    return {
                        ...msg,
                        reactions: [...msg.reactions, { emoji, count: 1 }]
                    };
                }
            }
            return msg;
        }));
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const totalPages = Math.ceil(messages.length / messagesPerPage);
    const startIndex = (currentPage - 1) * messagesPerPage;
    const endIndex = startIndex + messagesPerPage;
    const currentMessages = messages.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Community Discussion</h2>
                <p className="text-sm text-gray-600 mt-1">Real-time community conversations and interactions</p>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
                {currentMessages.map((message) => (
                    <div key={message.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{message.author}</span>
                                <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-3">{message.content}</p>
                        
                        {/* Reactions */}
                        <div className="flex items-center space-x-2">
                            {message.reactions.map((reaction, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleReaction(message.id, reaction.emoji)}
                                    className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    <span>{reaction.emoji}</span>
                                    <span className="text-xs text-gray-600">{reaction.count}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => handleReaction(message.id, '👍')}
                                className="px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                            >
                                + Add Reaction
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Send
                    </button>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(endIndex, messages.length)} of {messages.length} messages
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