import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    console.log('🚀 API: /api/epoch endpoint called');
    console.log('🚀 Request URL:', request.url);
    console.log('🚀 Request method:', request.method);
    console.log('📁 Current working directory:', process.cwd());

    try {
        // Try to read from the backend API first
        const backendPath = path.join(process.cwd(), '../../backend/api/epoch.json');
        console.log('🔍 Looking for epoch.json at:', backendPath);

        // Check if the directory exists
        const backendDir = path.dirname(backendPath);
        console.log('📂 Backend directory exists:', fs.existsSync(backendDir));
        console.log('📂 Backend directory contents:', fs.existsSync(backendDir) ? fs.readdirSync(backendDir) : 'Directory not found');

        if (!fs.existsSync(backendPath)) {
            console.error('❌ API: epoch.json not found at path:', backendPath);

            // Try alternative paths
            const altPaths = [
                path.join(process.cwd(), 'backend/api/epoch.json'),
                path.join(process.cwd(), '../backend/api/epoch.json'),
                path.join(process.cwd(), './backend/api/epoch.json'),
            ];

            console.log('🔍 Trying alternative paths:');
            for (const altPath of altPaths) {
                console.log(`  - ${altPath}: ${fs.existsSync(altPath) ? 'EXISTS' : 'NOT FOUND'}`);
            }

            return NextResponse.json(
                {
                    error: 'epoch.json file not found',
                    searchedPath: backendPath,
                    currentDir: process.cwd(),
                    alternativePaths: altPaths.map(p => ({ path: p, exists: fs.existsSync(p) }))
                },
                { status: 404 }
            );
        }

        console.log('📁 API: Reading epoch.json from:', backendPath);
        const data = fs.readFileSync(backendPath, 'utf8');
        const epochData = JSON.parse(data);
        console.log('📊 API: Serving epoch data:', {
            epoch: epochData.epoch,
            debates: epochData.debates?.length || 0,
            newsfeedPosts: epochData.newsfeed?.posts?.length || 0,
            candidates: epochData.candidates?.length || 0,
            populationVotes: epochData.population_votes?.length || 0
        });
        return NextResponse.json(epochData);
    } catch (error) {
        console.error('❌ API: Error reading epoch data:', error);
        return NextResponse.json(
            {
                error: 'Failed to load epoch data',
                details: error instanceof Error ? error.message : String(error),
                currentDir: process.cwd()
            },
            { status: 500 }
        );
    }
}
