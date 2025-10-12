import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(
    request: Request,
    { params }: { params: { simulationId: string } }
) {
    console.log('🚀 API: /api/simulation/[simulationId]/metadata endpoint called');

    try {
        const { simulationId } = params;

        if (!simulationId) {
            return NextResponse.json(
                { error: 'Simulation ID is required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${BACKEND_BASE_URL}/api/simulation/${simulationId}/metadata`);

        if (!response.ok) {
            throw new Error(`Failed to fetch metadata: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ API: Error fetching simulation metadata:', error);
        return NextResponse.json(
            {
                error: 'Failed to load simulation metadata from backend',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
