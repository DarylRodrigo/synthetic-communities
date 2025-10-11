'use client';

import { useNewsItems } from '@/lib/DataStore';

export default function FeedSection() {
    const newsItems = useNewsItems();

    return (
        <div className="relative">
            <div className="absolute inset-px rounded-lg bg-white shadow outline outline-1 outline-black/5" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                    <h3 className="text-lg font-semibold text-gray-900">Live Feed</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Real-time community activity
                    </p>
                </div>

                <div className="flex-1 px-6 pb-6 sm:px-8 sm:pb-8 overflow-y-auto">
                    <div className="space-y-4">
                        {newsItems.slice(0, 5).map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-indigo-600 font-medium text-sm">
                                            {item.author.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-sm font-medium text-gray-900">{item.author}</span>
                                            <span className="text-xs text-gray-500">now</span>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-2">{item.content}</p>

                                        {/* Reactions */}
                                        <div className="flex items-center space-x-2">
                                            {item.reactions.map((reaction, index) => (
                                                <button
                                                    key={index}
                                                    className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                                >
                                                    <span className="text-sm">{reaction.emoji}</span>
                                                    <span className="text-xs text-gray-600">{reaction.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {newsItems.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">No activity yet</p>
                                <p className="text-xs mt-1">Start the simulation to see posts</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
