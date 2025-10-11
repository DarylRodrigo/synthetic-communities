'use client';

import { useState } from 'react';

export default function APIDebugPage() {
    const [testResult, setTestResult] = useState<any>(null);
    const [epochResult, setEpochResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const testAPI = async () => {
        setLoading(true);
        try {
            console.log('Testing /api/test...');
            const response = await fetch('/api/test');
            const data = await response.json();
            setTestResult({ status: response.status, data });
            console.log('Test API result:', data);
        } catch (error) {
            setTestResult({ error: error instanceof Error ? error.message : String(error) });
            console.error('Test API error:', error);
        }
        setLoading(false);
    };

    const testEpochAPI = async () => {
        setLoading(true);
        try {
            console.log('Testing /api/epoch...');
            const response = await fetch('/api/epoch');
            const data = await response.json();
            setEpochResult({ status: response.status, data });
            console.log('Epoch API result:', data);
        } catch (error) {
            setEpochResult({ error: error instanceof Error ? error.message : String(error) });
            console.error('Epoch API error:', error);
        }
        setLoading(false);
    };

    const testPublicFile = async () => {
        setLoading(true);
        try {
            console.log('Testing /epoch.json...');
            const response = await fetch('/epoch.json');
            const data = await response.json();
            setEpochResult({ status: response.status, data, source: 'public file' });
            console.log('Public file result:', data);
        } catch (error) {
            setEpochResult({ error: error instanceof Error ? error.message : String(error) });
            console.error('Public file error:', error);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">API Debug Page</h1>

            <div className="space-y-6">
                <div className="border p-4 rounded">
                    <h2 className="text-xl font-semibold mb-4">Test API Routes</h2>
                    <div className="space-x-4">
                        <button
                            onClick={testAPI}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                        >
                            Test /api/test
                        </button>
                        <button
                            onClick={testEpochAPI}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                        >
                            Test /api/epoch
                        </button>
                        <button
                            onClick={testPublicFile}
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
                        >
                            Test /epoch.json (public)
                        </button>
                    </div>
                </div>

                {testResult && (
                    <div className="border p-4 rounded">
                        <h3 className="text-lg font-semibold mb-2">Test API Result:</h3>
                        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                            {JSON.stringify(testResult, null, 2)}
                        </pre>
                    </div>
                )}

                {epochResult && (
                    <div className="border p-4 rounded">
                        <h3 className="text-lg font-semibold mb-2">Epoch API Result:</h3>
                        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                            {JSON.stringify(epochResult, null, 2)}
                        </pre>
                    </div>
                )}

                {loading && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p>Loading...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
