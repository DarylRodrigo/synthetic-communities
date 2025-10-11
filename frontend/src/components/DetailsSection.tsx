'use client';

import { useNewsItems } from '@/lib/DataStore';

export default function DetailsSection() {
    const newsItems = useNewsItems();

    // Calculate some stats from the data
    const totalPosts = newsItems.length;
    const totalReactions = newsItems.reduce((sum, item) =>
        sum + item.reactions.reduce((reactionSum, reaction) => reactionSum + reaction.count, 0), 0
    );
    const uniqueAuthors = new Set(newsItems.map(item => item.author)).size;

    return (
        <div className="relative col-span-2">
            <div className="absolute inset-px rounded-lg bg-white shadow outline outline-1 outline-black/5" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                    <h3 className="text-lg font-semibold text-gray-900">Community Details</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Real-time statistics and insights
                    </p>
                </div>

                <div className="flex-1 px-6 pb-6 sm:px-8 sm:pb-8">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Stats cards */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-indigo-600">{totalPosts}</div>
                            <div className="text-sm text-gray-600">Total Posts</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-green-600">{totalReactions}</div>
                            <div className="text-sm text-gray-600">Reactions</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-purple-600">{uniqueAuthors}</div>
                            <div className="text-sm text-gray-600">Active Users</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-orange-600">
                                {totalPosts > 0 ? Math.round(totalReactions / totalPosts) : 0}
                            </div>
                            <div className="text-sm text-gray-600">Avg Reactions</div>
                        </div>
                    </div>

                    {/* Recent activity */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {newsItems.slice(0, 3).map((item) => (
                                <div key={item.id} className="text-xs text-gray-600 border-l-2 border-indigo-200 pl-3">
                                    <span className="font-medium">{item.author}</span> posted: "{item.content.substring(0, 50)}..."
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
