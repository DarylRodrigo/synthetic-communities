import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(
    request: Request,
    { params }: { params: { simulationId: string; epochNumber: string } }
) {
    console.log('🚀 API: /api/simulation/[simulationId]/epoch/[epochNumber] endpoint called');

    try {
        const { simulationId, epochNumber } = params;

        if (!simulationId) {
            return NextResponse.json(
                { error: 'Simulation ID is required' },
                { status: 400 }
            );
        }

        if (!epochNumber) {
            return NextResponse.json(
                { error: 'Epoch number is required' },
                { status: 400 }
            );
        }

        // Validate epoch number is a valid integer
        const epochNum = parseInt(epochNumber, 10);
        if (isNaN(epochNum) || epochNum < 0) {
            return NextResponse.json(
                { error: 'Epoch number must be a non-negative integer' },
                { status: 400 }
            );
        }

        const response = await fetch(`${BACKEND_BASE_URL}/api/simulation/${simulationId}/epoch/${epochNum}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch epoch: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ API: Error fetching epoch:', error);
        return NextResponse.json(
            {
                error: 'Failed to load epoch from backend',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
