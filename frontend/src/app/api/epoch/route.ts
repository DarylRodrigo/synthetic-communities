import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(request: Request) {
    console.log('🚀 API: /api/epoch endpoint called');

    try {
        // Get the list of available simulations
        const simulationsResponse = await fetch(`${BACKEND_BASE_URL}/api/simulations`);

        if (!simulationsResponse.ok) {
            throw new Error(`Failed to fetch simulations: ${simulationsResponse.status}`);
        }

        const simulationsData = await simulationsResponse.json();

        if (!simulationsData.simulations || simulationsData.simulations.length === 0) {
            return NextResponse.json(
                { error: 'No simulations available' },
                { status: 404 }
            );
        }

        // Get the latest simulation (first in the sorted list)
        const latestSimulation = simulationsData.simulations[0];

        // Get the first epoch from the latest simulation
        const epochResponse = await fetch(`${BACKEND_BASE_URL}/api/simulation/${latestSimulation.id}/epoch/0`);

        if (!epochResponse.ok) {
            throw new Error(`Failed to fetch epoch: ${epochResponse.status}`);
        }

        const epochData = await epochResponse.json();

        return NextResponse.json(epochData);
    } catch (error) {
        console.error('❌ API: Error fetching epoch data:', error);
        return NextResponse.json(
            {
                error: 'Failed to load epoch data from backend',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}