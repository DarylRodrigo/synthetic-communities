'use client';

import { Play, Pause, RotateCcw } from 'lucide-react';

export default function ControlsSection() {
    return (
        <div className="relative">
            <div className="absolute inset-px rounded-lg bg-white shadow outline outline-1 outline-black/5" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                    <h3 className="text-lg font-semibold text-gray-900">Controls</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage your synthetic community
                    </p>
                </div>

                <div className="flex-1 px-6 pb-6 sm:px-8 sm:pb-8">
                    <div className="space-y-4">
                        {/* Control buttons */}
                        <div className="flex gap-2">
                            <button className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                <Play className="w-5 h-5" />
                            </button>
                            <button className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                                <Pause className="w-5 h-5" />
                            </button>
                            <button className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Settings */}
                        <div className="pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Settings</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Speed</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        defaultValue="5"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Population</label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="1000"
                                        defaultValue="100"
                                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
