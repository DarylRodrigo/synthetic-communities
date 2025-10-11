'use client';

import { useNewsItems } from '@/lib/DataStore';

export default function NewsFeedTab() {
    const newsItems = useNewsItems();

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">News Feed</h2>
            </div>

            {/* News Items */}
            <div className="divide-y divide-gray-200">
                {newsItems.map((item) => (
                    <div key={item.id} className="p-6">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-lg font-semibold text-gray-900">{item.author}</span>
                                </div>
                                <p className="text-gray-700 mb-3">{item.content}</p>
                            </div>
                        </div>

                        {/* Reactions */}
                        <div className="flex items-center space-x-2 mt-4">
                            {item.reactions.map((reaction, index) => (
                                <div
                                    key={index}
                                    className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100"
                                >
                                    <span className="text-lg">{reaction.emoji}</span>
                                    <span className="text-sm text-gray-600">{reaction.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}