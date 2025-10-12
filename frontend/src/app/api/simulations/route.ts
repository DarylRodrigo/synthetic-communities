import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET() {
    console.log('🚀 API: /api/simulations endpoint called');

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/simulations`);

        if (!response.ok) {
            throw new Error(`Failed to fetch simulations: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ API: Error fetching simulations:', error);
        return NextResponse.json(
            {
                error: 'Failed to load simulations from backend',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
